create table private.church_live_guests (
  session_id uuid not null references public.church_live_sessions(id) on delete cascade,
  guest_token uuid not null,
  team smallint not null check (team between 0 and 3),
  joined_at timestamptz not null default now(),
  primary key (session_id, guest_token)
);

create table private.church_live_guest_answers (
  session_id uuid not null,
  activity_id uuid not null references public.church_study_activities(id) on delete cascade,
  guest_token uuid not null,
  is_correct boolean not null,
  points_awarded integer not null default 0,
  elapsed_ms integer not null check (elapsed_ms between 0 and 180000),
  submitted_at timestamptz not null default now(),
  primary key (session_id, activity_id, guest_token),
  foreign key (session_id, guest_token) references private.church_live_guests(session_id, guest_token) on delete cascade
);

alter table private.church_live_guests enable row level security;
alter table private.church_live_guest_answers enable row level security;
revoke all on private.church_live_guests, private.church_live_guest_answers from public, anon, authenticated;

create or replace function public.join_church_live_guest(target_projection_token uuid, new_guest_token uuid)
returns smallint
language plpgsql security definer
set search_path = ''
as $$
declare
  target_session uuid;
  team_mode boolean;
  assigned_team smallint;
begin
  if new_guest_token is null then raise exception 'Invalid guest session.' using errcode = '22023'; end if;
  select s.id, coalesce((s.state ->> 'teamMode')::boolean, false)
    into target_session, team_mode from public.church_live_sessions s
    where s.projection_token = target_projection_token and s.status = 'active' and s.expires_at > now();
  if target_session is null then raise exception 'This live session has ended.' using errcode = '22023'; end if;
  select g.team into assigned_team from private.church_live_guests g
    where g.session_id = target_session and g.guest_token = new_guest_token;
  if assigned_team is not null then return assigned_team; end if;
  if team_mode then
    select teams.team::smallint into assigned_team from (
      select n as team,
        (select count(*) from public.church_live_participants p where p.session_id = target_session and p.team = n)
        + (select count(*) from private.church_live_guests g where g.session_id = target_session and g.team = n) as members
      from generate_series(0, 3) n order by members, random() limit 1
    ) teams;
  else assigned_team := 0;
  end if;
  insert into private.church_live_guests(session_id, guest_token, team) values (target_session, new_guest_token, assigned_team);
  return assigned_team;
end;
$$;
revoke all on function public.join_church_live_guest(uuid, uuid) from public;
grant execute on function public.join_church_live_guest(uuid, uuid) to anon, authenticated;

create or replace function public.submit_church_guest_answer(
  target_projection_token uuid,
  target_guest_token uuid,
  target_activity uuid,
  submitted_answer jsonb
)
returns jsonb
language plpgsql security definer
set search_path = ''
as $$
declare
  target_session uuid;
  target_state jsonb;
  target_team smallint;
  correct jsonb;
  target_points integer;
  elapsed integer;
  is_right boolean;
  awarded integer;
  board jsonb;
begin
  select s.id, s.state into target_session, target_state from public.church_live_sessions s
    where s.projection_token = target_projection_token and s.status = 'active' and s.expires_at > now();
  if target_session is null then raise exception 'This live session has ended.' using errcode = '22023'; end if;
  select g.team into target_team from private.church_live_guests g
    where g.session_id = target_session and g.guest_token = target_guest_token;
  if target_team is null then raise exception 'Join the session before answering.' using errcode = '42501'; end if;
  if target_state ->> 'mode' <> 'quiz' or target_state ->> 'activityId' <> target_activity::text then raise exception 'This question is no longer open.' using errcode = '22023'; end if;
  if jsonb_typeof(submitted_answer) <> 'number' or (submitted_answer #>> '{}') !~ '^[0-3]$' then raise exception 'Choose one of the listed answers.' using errcode = '22023'; end if;
  elapsed := greatest(0, least(180000, floor(extract(epoch from clock_timestamp()) * 1000)::bigint - (target_state ->> 'openedAt')::bigint))::integer;
  if floor(extract(epoch from clock_timestamp()) * 1000)::bigint > (target_state ->> 'deadlineAt')::bigint then raise exception 'Time is up.' using errcode = '22023'; end if;
  select k.correct_answer, a.points into correct, target_points from private.church_study_activity_keys k
    join public.church_study_activities a on a.id = k.activity_id and a.enabled where k.activity_id = target_activity;
  if correct is null then raise exception 'Question answer is unavailable.' using errcode = '22023'; end if;
  is_right := submitted_answer = correct;
  awarded := case when is_right then greatest(1, target_points - (elapsed / 1000)) else 0 end;
  insert into private.church_live_guest_answers(session_id, activity_id, guest_token, is_correct, points_awarded, elapsed_ms)
    values (target_session, target_activity, target_guest_token, is_right, awarded, elapsed);
  if coalesce((target_state ->> 'teamMode')::boolean, false) then
    select jsonb_agg(jsonb_build_object('team', score.team, 'score', score.points) order by score.team) into board from (
      select teams.team, coalesce(sum(teams.points), 0)::integer as points from (
        select p.team, a.points_awarded as points from public.church_live_participants p
          left join public.church_live_answers a on a.session_id = p.session_id and a.user_id = p.user_id
          where p.session_id = target_session
        union all
        select g.team, a.points_awarded from private.church_live_guests g
          left join private.church_live_guest_answers a on a.session_id = g.session_id and a.guest_token = g.guest_token
          where g.session_id = target_session
      ) teams group by teams.team
    ) score;
  else
    select jsonb_agg(jsonb_build_object('rank', ranked.rank, 'score', ranked.points) order by ranked.rank) into board from (
      select row_number() over(order by score.points desc)::integer as rank, score.points from (
        select user_id::text as participant, sum(points_awarded)::integer as points from public.church_live_answers where session_id = target_session group by user_id
        union all
        select guest_token::text, sum(points_awarded)::integer from private.church_live_guest_answers where session_id = target_session group by guest_token
      ) score order by score.points desc limit 20
    ) ranked;
  end if;
  update public.church_live_sessions s set state = jsonb_set(s.state, '{scoreboard}', coalesce(board, '[]'::jsonb), true) where s.id = target_session;
  return jsonb_build_object('correct', is_right, 'points', awarded, 'team', target_team);
exception when unique_violation then
  raise exception 'You have already answered this question.' using errcode = '23505';
end;
$$;
revoke all on function public.submit_church_guest_answer(uuid, uuid, uuid, jsonb) from public;
grant execute on function public.submit_church_guest_answer(uuid, uuid, uuid, jsonb) to anon, authenticated;
