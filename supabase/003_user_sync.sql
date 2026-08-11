create table if not exists public.user_app_state (
  user_id uuid not null references public.profiles(id) on delete cascade,
  state_key text not null,
  payload jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now(),
  primary key (user_id, state_key)
);

create index if not exists user_app_state_user_id_idx
  on public.user_app_state(user_id);

alter table public.user_app_state enable row level security;

drop policy if exists "user_app_state_all_own" on public.user_app_state;
create policy "user_app_state_all_own"
on public.user_app_state for all
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop trigger if exists user_app_state_set_updated_at on public.user_app_state;
create trigger user_app_state_set_updated_at
before update on public.user_app_state
for each row execute function public.set_updated_at();

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, display_name)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'display_name', split_part(coalesce(new.email, 'Brother'), '@', 1))
  )
  on conflict (id) do update
  set email = excluded.email;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();
