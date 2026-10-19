create schema if not exists private;

create table if not exists public.churches (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(btrim(name)) between 2 and 120),
  city text,
  country text,
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  created_by uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

create table if not exists public.church_memberships (
  id uuid primary key default gen_random_uuid(),
  church_id uuid not null references public.churches(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null default 'member' check (role in ('manager', 'teacher', 'member')),
  status text not null default 'pending' check (status in ('pending', 'active', 'rejected')),
  created_at timestamptz not null default now(),
  unique (church_id, user_id)
);

create table if not exists public.church_studies (
  id uuid primary key default gen_random_uuid(),
  church_id uuid not null references public.churches(id) on delete cascade,
  created_by uuid not null references auth.users(id) on delete restrict,
  title text not null check (char_length(btrim(title)) between 1 and 180),
  theme text not null default '',
  duration_minutes integer not null default 45 check (duration_minutes in (30, 45, 60)),
  status text not null default 'draft' check (status in ('draft', 'upcoming', 'published', 'archived')),
  content jsonb not null default '{"sections":[],"activities":[]}'::jsonb,
  scheduled_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.church_study_notes (
  id uuid primary key default gen_random_uuid(),
  study_id uuid not null references public.church_studies(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  body text not null default '',
  updated_at timestamptz not null default now(),
  unique (study_id, user_id)
);

create index if not exists church_memberships_user_status_idx on public.church_memberships(user_id, status);
create index if not exists church_studies_church_status_idx on public.church_studies(church_id, status, updated_at desc);

create or replace function private.is_global_church_admin()
returns boolean
language sql stable security definer
set search_path = ''
as $$
  select coalesce((select auth.jwt() -> 'app_metadata' ->> 'role') = 'global_admin', false)
$$;

create or replace function private.is_church_member(target_church uuid)
returns boolean
language sql stable security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.church_memberships m
    where m.church_id = target_church
      and m.user_id = (select auth.uid())
      and m.status = 'active'
  )
$$;

create or replace function private.can_manage_church(target_church uuid)
returns boolean
language sql stable security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.church_memberships m
    where m.church_id = target_church
      and m.user_id = (select auth.uid())
      and m.status = 'active'
      and m.role in ('manager', 'teacher')
  )
$$;

create or replace function private.is_church_manager(target_church uuid)
returns boolean
language sql stable security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.church_memberships m
    where m.church_id = target_church
      and m.user_id = (select auth.uid())
      and m.status = 'active'
      and m.role = 'manager'
  )
$$;

create or replace function private.study_church(target_study uuid)
returns uuid
language sql stable security definer
set search_path = ''
as $$
  select s.church_id from public.church_studies s where s.id = target_study
$$;

revoke all on function private.is_global_church_admin() from public, anon;
revoke all on function private.is_church_member(uuid) from public, anon;
revoke all on function private.can_manage_church(uuid) from public, anon;
revoke all on function private.is_church_manager(uuid) from public, anon;
revoke all on function private.study_church(uuid) from public, anon;
create or replace function private.activate_church_creator_as_manager()
returns trigger
language plpgsql security definer
set search_path = ''
as $$
begin
  if old.status <> 'approved' and new.status = 'approved' then
    insert into public.church_memberships (church_id, user_id, role, status)
    values (new.id, new.created_by, 'manager', 'active')
    on conflict (church_id, user_id) do update
      set role = 'manager', status = 'active';
  end if;
  return new;
end;
$$;
revoke all on function private.activate_church_creator_as_manager() from public, anon, authenticated;
grant usage on schema private to authenticated;
grant execute on function private.is_global_church_admin() to authenticated;
grant execute on function private.is_church_member(uuid) to authenticated;
grant execute on function private.is_church_member(uuid) to anon;
grant execute on function private.can_manage_church(uuid) to authenticated;
grant execute on function private.is_church_manager(uuid) to authenticated;
grant execute on function private.study_church(uuid) to authenticated;

alter table public.churches enable row level security;
alter table public.church_memberships enable row level security;
alter table public.church_studies enable row level security;
alter table public.church_study_notes enable row level security;

grant select, insert on public.churches to authenticated;
grant update (status) on public.churches to authenticated;
grant select, insert on public.church_memberships to authenticated;
grant update (status) on public.church_memberships to authenticated;
grant update (role) on public.church_memberships to authenticated;
grant select, insert, update, delete on public.church_studies to authenticated;
grant select, insert, update, delete on public.church_study_notes to authenticated;

create policy "churches discover approved or own pending"
on public.churches for select to authenticated
using (status = 'approved' or created_by = (select auth.uid()) or (select private.is_global_church_admin()));

create policy "users request church approval"
on public.churches for insert to authenticated
with check (created_by = (select auth.uid()) and status = 'pending');

create policy "global admins approve churches"
on public.churches for update to authenticated
using ((select private.is_global_church_admin()))
with check ((select private.is_global_church_admin()));

create policy "members see own or active church membership"
on public.church_memberships for select to authenticated
using (user_id = (select auth.uid()) or (status = 'active' and (select private.is_church_member(church_id))) or (select private.can_manage_church(church_id)) or (select private.is_global_church_admin()));

create policy "users request membership"
on public.church_memberships for insert to authenticated
with check (user_id = (select auth.uid()) and role = 'member' and status = 'pending');

create policy "global admins assign church managers"
on public.church_memberships for insert to authenticated
with check ((select private.is_global_church_admin()) and role = 'manager' and status = 'active');

create trigger churches_activate_creator_as_manager
after update of status on public.churches
for each row execute function private.activate_church_creator_as_manager();

create policy "managers review memberships"
on public.church_memberships for update to authenticated
using ((select private.is_church_manager(church_id)) or (select private.is_global_church_admin()))
with check ((select private.is_church_manager(church_id)) or (select private.is_global_church_admin()));

create policy "managers assign church roles"
on public.church_memberships for update to authenticated
using ((select private.is_church_manager(church_id)) or (select private.is_global_church_admin()))
with check (role in ('manager', 'teacher', 'member') and ((select private.is_church_manager(church_id)) or (select private.is_global_church_admin())));

create policy "members read church studies"
on public.church_studies for select to authenticated
using (((select private.is_church_member(church_id)) and status <> 'draft') or (select private.can_manage_church(church_id)));

create policy "teachers create studies"
on public.church_studies for insert to authenticated
with check (created_by = (select auth.uid()) and (select private.can_manage_church(church_id)));

create policy "teachers update studies"
on public.church_studies for update to authenticated
using ((select private.can_manage_church(church_id)))
with check ((select private.can_manage_church(church_id)));

create policy "teachers delete studies"
on public.church_studies for delete to authenticated
using ((select private.can_manage_church(church_id)));

create policy "users manage their own church study notes"
on public.church_study_notes for all to authenticated
using (user_id = (select auth.uid()) and (select private.is_church_member((select private.study_church(study_id)))))
with check (user_id = (select auth.uid()) and (select private.is_church_member((select private.study_church(study_id)))));

create or replace function public.set_church_study_updated_at()
returns trigger language plpgsql set search_path = '' as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger church_studies_set_updated_at
before update on public.church_studies
for each row execute function public.set_church_study_updated_at();

create trigger church_study_notes_set_updated_at
before update on public.church_study_notes
for each row execute function public.set_church_study_updated_at();
