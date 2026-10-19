create table public.church_live_sessions (
  id uuid primary key default gen_random_uuid(),
  church_id uuid not null references public.churches(id) on delete cascade,
  study_id uuid not null references public.church_studies(id) on delete restrict,
  created_by uuid not null references auth.users(id) on delete restrict,
  projection_token uuid not null unique default gen_random_uuid(),
  status text not null default 'active' check (status in ('active', 'ended')),
  state jsonb not null default '{}'::jsonb,
  started_at timestamptz not null default now(),
  ended_at timestamptz,
  expires_at timestamptz not null default (now() + interval '8 hours')
);

create unique index church_one_active_live_session_idx
  on public.church_live_sessions(church_id) where status = 'active';
create index church_live_sessions_study_idx on public.church_live_sessions(study_id, started_at desc);

alter table public.church_live_sessions enable row level security;
revoke all on public.church_live_sessions from anon, authenticated;
grant select (id, church_id, study_id, projection_token, status, state, started_at, ended_at, expires_at)
  on public.church_live_sessions to authenticated;
grant insert (church_id, study_id, created_by, projection_token, state, expires_at)
  on public.church_live_sessions to authenticated;
grant update (status, state, ended_at, expires_at)
  on public.church_live_sessions to authenticated;

create policy "members read active live session"
on public.church_live_sessions for select to authenticated
using (
  status = 'active' and expires_at > now()
  and (select private.is_church_member(church_id))
);

create policy "teachers start live sessions"
on public.church_live_sessions for insert to authenticated
with check (
  created_by = (select auth.uid())
  and status = 'active'
  and (select private.can_manage_church(church_id))
  and (select private.is_church_member(church_id))
  and exists (
    select 1 from public.church_studies study
    where study.id = study_id and study.church_id = church_id and study.status <> 'draft'
  )
);

create policy "teachers update live sessions"
on public.church_live_sessions for update to authenticated
using ((select private.can_manage_church(church_id)))
with check ((select private.can_manage_church(church_id)));

do $$
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime')
    and not exists (
      select 1 from pg_publication_tables
      where pubname = 'supabase_realtime'
        and schemaname = 'public'
        and tablename = 'church_live_sessions'
    ) then
    alter publication supabase_realtime add table public.church_live_sessions;
  end if;
end
$$;
