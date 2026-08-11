create table if not exists public.prayer_requests (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null references public.profiles(id) on delete cascade,
  content text not null check (char_length(content) between 1 and 2200),
  prayer_count integer not null default 0 check (prayer_count >= 0),
  status text not null default 'active' check (status in ('active', 'archived', 'answered')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.prayer_interactions (
  id uuid primary key default gen_random_uuid(),
  request_id uuid not null references public.prayer_requests(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (request_id, user_id)
);

create index if not exists prayer_requests_status_created_idx
  on public.prayer_requests(status, created_at desc);

create index if not exists prayer_interactions_request_id_idx
  on public.prayer_interactions(request_id);

alter table public.prayer_requests enable row level security;
alter table public.prayer_interactions enable row level security;

drop policy if exists "prayer_requests_read_active" on public.prayer_requests;
create policy "prayer_requests_read_active"
on public.prayer_requests for select
using (status = 'active' or auth.uid() = author_id);

drop policy if exists "prayer_requests_insert_own" on public.prayer_requests;
create policy "prayer_requests_insert_own"
on public.prayer_requests for insert
with check (auth.uid() = author_id);

drop policy if exists "prayer_requests_update_own" on public.prayer_requests;
create policy "prayer_requests_update_own"
on public.prayer_requests for update
using (auth.uid() = author_id)
with check (auth.uid() = author_id);

drop policy if exists "prayer_requests_delete_own" on public.prayer_requests;
create policy "prayer_requests_delete_own"
on public.prayer_requests for delete
using (auth.uid() = author_id);

drop policy if exists "prayer_interactions_read_own" on public.prayer_interactions;
create policy "prayer_interactions_read_own"
on public.prayer_interactions for select
using (auth.uid() = user_id);

drop policy if exists "prayer_interactions_insert_own" on public.prayer_interactions;
create policy "prayer_interactions_insert_own"
on public.prayer_interactions for insert
with check (auth.uid() = user_id);

create or replace function public.pray_for_request(request_uuid uuid)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  new_count integer;
begin
  insert into public.prayer_interactions (request_id, user_id)
  values (request_uuid, auth.uid())
  on conflict (request_id, user_id) do nothing;

  if found then
    update public.prayer_requests
    set prayer_count = prayer_count + 1,
        updated_at = now()
    where id = request_uuid and status = 'active'
    returning prayer_count into new_count;
  else
    select prayer_count into new_count
    from public.prayer_requests
    where id = request_uuid;
  end if;

  return coalesce(new_count, 0);
end;
$$;

revoke execute on function public.pray_for_request(uuid) from public;
grant execute on function public.pray_for_request(uuid) to authenticated;

drop trigger if exists prayer_requests_set_updated_at on public.prayer_requests;
create trigger prayer_requests_set_updated_at
before update on public.prayer_requests
for each row execute function public.set_updated_at();
