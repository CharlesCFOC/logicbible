-- Prayer Community moderation: reports can be reviewed and harmful posts removed.

alter table public.prayer_requests
  drop constraint if exists prayer_requests_status_check;

alter table public.prayer_requests
  add constraint prayer_requests_status_check
  check (status in ('pending', 'active', 'archived', 'answered', 'rejected'));

alter table public.prayer_requests
  alter column status set default 'active',
  add column if not exists terms_accepted_at timestamptz;

-- Requests submitted during the earlier review-first prototype should remain visible.
update public.prayer_requests set status = 'active' where status = 'pending';

create table if not exists public.app_moderators (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now()
);

create table if not exists public.blocked_users (
  blocker_id uuid not null references public.profiles(id) on delete cascade,
  blocked_user_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (blocker_id, blocked_user_id),
  check (blocker_id <> blocked_user_id)
);

create table if not exists public.prayer_reports (
  id uuid primary key default gen_random_uuid(),
  request_id uuid not null references public.prayer_requests(id) on delete cascade,
  reporter_id uuid not null references public.profiles(id) on delete cascade,
  reason text not null check (reason in ('personal-information', 'bullying', 'sexual-content', 'violence', 'spam', 'other')),
  details text not null default '' check (char_length(details) <= 500),
  status text not null default 'open' check (status in ('open', 'reviewed', 'resolved')),
  created_at timestamptz not null default now(),
  unique (request_id, reporter_id)
);

alter table public.app_moderators enable row level security;
alter table public.blocked_users enable row level security;
alter table public.prayer_reports enable row level security;

grant select on public.app_moderators to authenticated;
grant select, insert, update, delete on public.blocked_users to authenticated;
grant select, insert, update on public.prayer_reports to authenticated;

create or replace function public.is_app_moderator()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.app_moderators
    where user_id = auth.uid()
  );
$$;

drop policy if exists "app_moderators_read_own" on public.app_moderators;
create policy "app_moderators_read_own"
on public.app_moderators for select
using (auth.uid() = user_id);

drop policy if exists "blocked_users_manage_own" on public.blocked_users;
create policy "blocked_users_manage_own"
on public.blocked_users for all
using (auth.uid() = blocker_id)
with check (auth.uid() = blocker_id and blocker_id <> blocked_user_id);

drop policy if exists "prayer_reports_create_own" on public.prayer_reports;
create policy "prayer_reports_create_own"
on public.prayer_reports for insert
with check (auth.uid() = reporter_id);

drop policy if exists "prayer_reports_read_moderator" on public.prayer_reports;
create policy "prayer_reports_read_moderator"
on public.prayer_reports for select
using (public.is_app_moderator());

drop policy if exists "prayer_reports_update_moderator" on public.prayer_reports;
create policy "prayer_reports_update_moderator"
on public.prayer_reports for update
using (public.is_app_moderator())
with check (public.is_app_moderator());

drop policy if exists "prayer_requests_read_active" on public.prayer_requests;
drop policy if exists "prayer_requests_read_own" on public.prayer_requests;
drop policy if exists "prayer_requests_read_public_wall" on public.prayer_requests;
create policy "prayer_requests_read_safe_wall"
on public.prayer_requests for select
using (
  public.is_app_moderator()
  or auth.uid() = author_id
  or (
    status = 'active'
    and not exists (
      select 1 from public.blocked_users
      where blocker_id = auth.uid()
        and blocked_user_id = prayer_requests.author_id
    )
  )
);

drop policy if exists "prayer_requests_insert_own" on public.prayer_requests;
drop policy if exists "prayer_requests_submit_for_review" on public.prayer_requests;
drop policy if exists "prayer_requests_insert_active" on public.prayer_requests;
create policy "prayer_requests_insert_active"
on public.prayer_requests for insert
with check (
  auth.uid() = author_id
  and status = 'active'
  and terms_accepted_at is not null
);

drop policy if exists "prayer_requests_update_own" on public.prayer_requests;

create or replace function public.moderate_prayer_request(request_uuid uuid, next_status text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_app_moderator() then
    raise exception 'Only a moderator can review prayer requests.';
  end if;
  if next_status not in ('active', 'rejected', 'archived') then
    raise exception 'Invalid moderation status.';
  end if;
  update public.prayer_requests
  set status = next_status,
      updated_at = now()
  where id = request_uuid;
end;
$$;

revoke all on function public.moderate_prayer_request(uuid, text) from public;
grant execute on function public.moderate_prayer_request(uuid, text) to authenticated;

-- After running this migration, add the first moderator manually in Supabase:
-- insert into public.app_moderators (user_id) values ('YOUR_AUTH_USER_UUID');
