create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text unique,
  display_name text,
  avatar_url text,
  bio text,
  streak integer not null default 0,
  xp integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.user_preferences (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  app_background text not null default 'dark',
  text_size text not null default 'medium',
  accent text not null default 'electric-blue',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.user_topic_progress (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  track_id text not null,
  topic_id text not null,
  status text not null default 'not_started' check (status in ('not_started', 'in_progress', 'completed')),
  progress_percent integer not null default 0 check (progress_percent >= 0 and progress_percent <= 100),
  reading_time_minutes integer not null default 0,
  completed_at timestamptz,
  last_opened_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, topic_id)
);

create index if not exists user_topic_progress_user_id_idx
  on public.user_topic_progress(user_id);

create index if not exists user_topic_progress_track_id_idx
  on public.user_topic_progress(track_id);

create table if not exists public.user_saved_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  item_type text not null check (item_type in ('bookmark', 'highlight', 'note', 'ai-bookmark')),
  item_key text not null,
  title text,
  content text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, item_type, item_key)
);

create index if not exists user_saved_items_user_id_idx
  on public.user_saved_items(user_id);

create table if not exists public.ai_conversations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  conversation_type text not null check (conversation_type in ('brother-ai', 'apologetics')),
  track_id text,
  topic_id text,
  title text,
  messages jsonb not null default '[]'::jsonb,
  archived boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists ai_conversations_user_id_idx
  on public.ai_conversations(user_id);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

drop trigger if exists user_preferences_set_updated_at on public.user_preferences;
create trigger user_preferences_set_updated_at
before update on public.user_preferences
for each row execute function public.set_updated_at();

drop trigger if exists user_topic_progress_set_updated_at on public.user_topic_progress;
create trigger user_topic_progress_set_updated_at
before update on public.user_topic_progress
for each row execute function public.set_updated_at();

drop trigger if exists user_saved_items_set_updated_at on public.user_saved_items;
create trigger user_saved_items_set_updated_at
before update on public.user_saved_items
for each row execute function public.set_updated_at();

drop trigger if exists ai_conversations_set_updated_at on public.ai_conversations;
create trigger ai_conversations_set_updated_at
before update on public.ai_conversations
for each row execute function public.set_updated_at();

alter table public.profiles enable row level security;
alter table public.user_preferences enable row level security;
alter table public.user_topic_progress enable row level security;
alter table public.user_saved_items enable row level security;
alter table public.ai_conversations enable row level security;

drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own"
on public.profiles for select
using (auth.uid() = id);

drop policy if exists "profiles_insert_own" on public.profiles;
create policy "profiles_insert_own"
on public.profiles for insert
with check (auth.uid() = id);

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own"
on public.profiles for update
using (auth.uid() = id);

drop policy if exists "user_preferences_all_own" on public.user_preferences;
create policy "user_preferences_all_own"
on public.user_preferences for all
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "user_topic_progress_all_own" on public.user_topic_progress;
create policy "user_topic_progress_all_own"
on public.user_topic_progress for all
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "user_saved_items_all_own" on public.user_saved_items;
create policy "user_saved_items_all_own"
on public.user_saved_items for all
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "ai_conversations_all_own" on public.ai_conversations;
create policy "ai_conversations_all_own"
on public.ai_conversations for all
using (auth.uid() = user_id)
with check (auth.uid() = user_id);
