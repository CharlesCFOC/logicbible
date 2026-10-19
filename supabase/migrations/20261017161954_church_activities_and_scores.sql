create table public.church_study_activities (
  id uuid primary key default gen_random_uuid(),
  study_id uuid not null references public.church_studies(id) on delete cascade,
  position integer not null default 0 check (position >= 0),
  kind text not null check (kind in ('multiple_choice', 'true_false', 'verse_completion', 'event_order', 'matching', 'verse_challenge')),
  prompt text not null check (char_length(btrim(prompt)) between 1 and 800),
  options jsonb not null check (jsonb_typeof(options) = 'array' and jsonb_array_length(options) between 2 and 4),
  explanation text not null default '',
  duration_seconds integer not null default 30 check (duration_seconds between 10 and 180),
  points integer not null default 100 check (points between 1 and 1000),
  created_at timestamptz not null default now()
);

create table private.church_study_activity_keys (
  activity_id uuid primary key references public.church_study_activities(id) on delete cascade,
  correct_answer jsonb not null
);

create table public.church_live_participants (
  session_id uuid not null references public.church_live_sessions(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  team smallint not null check (team between 0 and 3),
  joined_at timestamptz not null default now(),
  primary key (session_id, user_id)
);

create table public.church_live_answers (
  session_id uuid not null references public.church_live_sessions(id) on delete cascade,
  activity_id uuid not null references public.church_study_activities(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  submitted_answer jsonb not null,
  is_correct boolean not null,
  points_awarded integer not null default 0,
  elapsed_ms integer not null check (elapsed_ms between 0 and 180000),
  submitted_at timestamptz not null default now(),
  primary key (session_id, activity_id, user_id)
);

alter table public.church_study_activities enable row level security;
alter table private.church_study_activity_keys enable row level security;
alter table public.church_live_participants enable row level security;
alter table public.church_live_answers enable row level security;

grant select, insert, update, delete on public.church_study_activities to authenticated;
revoke all on private.church_study_activity_keys from public, anon, authenticated;
revoke all on public.church_live_participants from public, anon, authenticated;
revoke all on public.church_live_answers from public, anon, authenticated;

create policy "members read published study activities"
on public.church_study_activities for select to authenticated
using (
  (select private.can_manage_church((select private.study_church(study_id))))
  or ((select private.is_church_member((select private.study_church(study_id))))
    and exists (select 1 from public.church_studies s where s.id = study_id and s.status <> 'draft'))
);

create policy "teachers manage study activities"
on public.church_study_activities for all to authenticated
using ((select private.can_manage_church((select private.study_church(study_id)))))
with check ((select private.can_manage_church((select private.study_church(study_id)))));

create or replace function public.create_church_study_activity(
  target_study uuid,
  activity_kind text,
  activity_prompt text,
  activity_options jsonb,
  correct_answer jsonb,
  activity_explanation text,
  activity_duration integer default 30,
  activity_points integer default 100
)
returns uuid
language plpgsql security definer
set search_path = ''
as $$
declare
  activity_id uuid;
  next_position integer;
begin
  if (select auth.uid()) is null then raise exception 'Sign in to add a question.' using errcode = '42501'; end if;
  if not exists (select 1 from public.church_studies s where s.id = target_study and s.status = 'draft'
    and private.can_manage_church(s.church_id)) then
    raise exception 'Only an unpublished study can be edited.' using errcode = '42501';
  end if;
  select coalesce(max(a.position) + 1, 0) into next_position from public.church_study_activities a where a.study_id = target_study;
  insert into public.church_study_activities (study_id, position, kind, prompt, options, explanation, duration_seconds, points)
  values (target_study, next_position, activity_kind, activity_prompt, activity_options, activity_explanation, activity_duration, activity_points)
  returning id into activity_id;
  insert into private.church_study_activity_keys (activity_id, correct_answer) values (activity_id, correct_answer);
  return activity_id;
end;
$$;
revoke all on function public.create_church_study_activity(uuid, text, text, jsonb, jsonb, text, integer, integer) from public, anon;
grant execute on function public.create_church_study_activity(uuid, text, text, jsonb, jsonb, text, integer, integer) to authenticated;

create or replace function public.start_church_live_activity(target_session uuid, target_activity uuid)
returns jsonb
language plpgsql security definer
set search_path = ''
as $$
declare
  current_church uuid;
  target_study uuid;
  activity_row record;
  new_state jsonb;
  opened_ms bigint;
begin
  if (select auth.uid()) is null then raise exception 'Sign in to control this session.' using errcode = '42501'; end if;
  select s.church_id, s.study_id into current_church, target_study from public.church_live_sessions s
    where s.id = target_session and s.status = 'active' and s.expires_at > now();
  if current_church is null or not private.can_manage_church(current_church) then
    raise exception 'You cannot control this session.' using errcode = '42501';
  end if;
  select a.id, a.kind, a.prompt, a.options, a.duration_seconds into activity_row
    from public.church_study_activities a where a.id = target_activity and a.study_id = target_study and a.enabled;
  if activity_row.id is null then raise exception 'Question not found in this study.' using errcode = '22023'; end if;
  opened_ms := floor(extract(epoch from clock_timestamp()) * 1000)::bigint;
  new_state := (select s.state from public.church_live_sessions s where s.id = target_session)
    || jsonb_build_object(
      'mode', 'quiz', 'activityId', target_activity,
      'question', jsonb_build_object('kind', activity_row.kind, 'prompt', activity_row.prompt, 'options', activity_row.options, 'durationSeconds', activity_row.duration_seconds),
      'openedAt', opened_ms, 'deadlineAt', opened_ms + activity_row.duration_seconds * 1000, 'scoreboard', '[]'::jsonb
    );
  update public.church_live_sessions set state = new_state where id = target_session;
  return new_state;
end;
$$;
revoke all on function public.start_church_live_activity(uuid, uuid) from public, anon;
grant execute on function public.start_church_live_activity(uuid, uuid) to authenticated;

create or replace function public.join_church_live_session(target_session uuid)
returns smallint
language plpgsql security definer
set search_path = ''
as $$
declare
  target_church uuid;
  team_mode boolean;
  assigned_team smallint;
begin
  if (select auth.uid()) is null then raise exception 'Sign in to join this session.' using errcode = '42501'; end if;
  select s.church_id, coalesce((s.state ->> 'teamMode')::boolean, false)
    into target_church, team_mode
    from public.church_live_sessions s
    where s.id = target_session and s.status = 'active' and s.expires_at > now();
  if target_church is null or not private.is_church_member(target_church) then
    raise exception 'This live session is unavailable.' using errcode = '42501';
  end if;
  select p.team into assigned_team from public.church_live_participants p
    where p.session_id = target_session and p.user_id = (select auth.uid());
  if assigned_team is not null then return assigned_team; end if;
  if team_mode then
    select teams.team::smallint into assigned_team
    from (
      select n as team, count(p.user_id) as members
      from generate_series(0, 3) n
      left join public.church_live_participants p on p.session_id = target_session and p.team = n
      group by n order by count(p.user_id), random() limit 1
    ) teams;
  else
    assigned_team := 0;
  end if;
  insert into public.church_live_participants (session_id, user_id, team)
  values (target_session, (select auth.uid()), assigned_team)
  on conflict (session_id, user_id) do nothing;
  select p.team into assigned_team from public.church_live_participants p
    where p.session_id = target_session and p.user_id = (select auth.uid());
  return assigned_team;
end;
$$;
revoke all on function public.join_church_live_session(uuid) from public, anon;
grant execute on function public.join_church_live_session(uuid) to authenticated;

create or replace function public.submit_church_live_answer(
  target_session uuid,
  target_activity uuid,
  submitted_answer jsonb
)
returns jsonb
language plpgsql security definer
set search_path = ''
as $$
declare
  target_church uuid;
  target_state jsonb;
  assigned_team smallint;
  correct jsonb;
  is_right boolean;
  points_value integer;
  awarded integer;
  answer_elapsed_ms integer;
  board jsonb;
begin
  if (select auth.uid()) is null then raise exception 'Sign in to answer.' using errcode = '42501'; end if;
  select s.church_id, s.state into target_church, target_state
    from public.church_live_sessions s
    where s.id = target_session and s.status = 'active' and s.expires_at > now();
  if target_church is null or not private.is_church_member(target_church) then
    raise exception 'This live session is unavailable.' using errcode = '42501';
  end if;
  if target_state ->> 'mode' <> 'quiz' or target_state ->> 'activityId' <> target_activity::text then
    raise exception 'This question is no longer open.' using errcode = '22023';
  end if;
  if target_state ->> 'openedAt' is null or target_state ->> 'deadlineAt' is null then
    raise exception 'Question timer is unavailable.' using errcode = '22023';
  end if;
  if jsonb_typeof(submitted_answer) <> 'number' or (submitted_answer #>> '{}') !~ '^[0-3]$' then
    raise exception 'Choose one of the listed answers.' using errcode = '22023';
  end if;
  answer_elapsed_ms := greatest(0, least(180000, floor(extract(epoch from clock_timestamp()) * 1000)::bigint - (target_state ->> 'openedAt')::bigint))::integer;
  if floor(extract(epoch from clock_timestamp()) * 1000)::bigint > (target_state ->> 'deadlineAt')::bigint then
    raise exception 'Time is up.' using errcode = '22023';
  end if;
  select p.team into assigned_team from public.church_live_participants p
    where p.session_id = target_session and p.user_id = (select auth.uid());
  if assigned_team is null then raise exception 'Join the session before answering.' using errcode = '42501'; end if;
  select k.correct_answer, a.points into correct, points_value
    from private.church_study_activity_keys k
    join public.church_study_activities a on a.id = k.activity_id
    where k.activity_id = target_activity;
  if correct is null then raise exception 'Question answer is unavailable.' using errcode = '22023'; end if;
  is_right := submitted_answer = correct;
  awarded := case when is_right then greatest(1, points_value - (answer_elapsed_ms / 1000)) else 0 end;
  insert into public.church_live_answers (session_id, activity_id, user_id, submitted_answer, is_correct, points_awarded, elapsed_ms)
  values (target_session, target_activity, (select auth.uid()), submitted_answer, is_right, awarded, answer_elapsed_ms);
  if coalesce((target_state ->> 'teamMode')::boolean, false) then
    select jsonb_agg(jsonb_build_object('team', teams.team, 'score', teams.score) order by teams.team)
      into board from (
        select p.team, coalesce(sum(a.points_awarded), 0)::integer as score
        from public.church_live_participants p
        left join public.church_live_answers a on a.session_id = p.session_id and a.user_id = p.user_id
        where p.session_id = target_session group by p.team
      ) teams;
  else
    select jsonb_agg(jsonb_build_object('rank', ranked.rank, 'score', ranked.score) order by ranked.rank)
      into board from (
        select row_number() over (order by sum(a.points_awarded) desc, min(a.submitted_at))::integer as rank,
          sum(a.points_awarded)::integer as score
        from public.church_live_answers a where a.session_id = target_session group by a.user_id limit 20
      ) ranked;
  end if;
  update public.church_live_sessions s
    set state = jsonb_set(s.state, '{scoreboard}', coalesce(board, '[]'::jsonb), true)
    where s.id = target_session;
  return jsonb_build_object('correct', is_right, 'points', awarded, 'team', assigned_team);
exception when unique_violation then
  raise exception 'You have already answered this question.' using errcode = '23505';
end;
$$;
revoke all on function public.submit_church_live_answer(uuid, uuid, jsonb) from public, anon;
grant execute on function public.submit_church_live_answer(uuid, uuid, jsonb) to authenticated;

create or replace function public.check_church_replay_answer(target_activity uuid, submitted_answer jsonb)
returns jsonb
language plpgsql security definer
set search_path = ''
as $$
declare
  target_church uuid;
  target_status text;
  correct jsonb;
  explanation text;
begin
  if (select auth.uid()) is null then raise exception 'Sign in to replay this study.' using errcode = '42501'; end if;
  select s.church_id, s.status into target_church, target_status
    from public.church_study_activities a join public.church_studies s on s.id = a.study_id
    where a.id = target_activity;
  if target_church is null or target_status <> 'archived' or not private.is_church_member(target_church) then
    raise exception 'This replay is unavailable.' using errcode = '42501';
  end if;
  select k.correct_answer, a.explanation into correct, explanation
    from private.church_study_activity_keys k join public.church_study_activities a on a.id = k.activity_id
    where k.activity_id = target_activity;
  return jsonb_build_object('correct', submitted_answer = correct, 'explanation', explanation);
end;
$$;
revoke all on function public.check_church_replay_answer(uuid, jsonb) from public, anon;
grant execute on function public.check_church_replay_answer(uuid, jsonb) to authenticated;
