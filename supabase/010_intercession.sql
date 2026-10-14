-- Global intercession sessions, anonymous country-level presence and topic voting.
-- No IP address or precise location is stored.

create table if not exists public.intercession_topics (
  id text primary key,
  title text not null,
  description text not null default '',
  verse_reference text not null default '',
  active boolean not null default true,
  created_at timestamptz not null default now()
);

insert into public.intercession_topics (id, title, description, verse_reference) values
  ('families','Families & relationships','Peace, reconciliation, wisdom, and strong homes.','Joshua 24:15'),
  ('healing','Healing & strength','People facing sickness, grief, exhaustion, and recovery.','James 5:16'),
  ('nations','Nations & peace','Leaders, justice, peace, and people affected by conflict.','1 Timothy 2:1–2'),
  ('salvation','Salvation & faith','People to encounter Christ and grow in faith.','1 Timothy 2:4'),
  ('church','The Church','Unity, courage, wisdom, and faithful witness.','Ephesians 4:3')
on conflict (id) do nothing;

create table if not exists public.intercession_votes (
  topic_id text not null references public.intercession_topics(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  vote_window timestamptz not null,
  created_at timestamptz not null default now(),
  primary key (topic_id, user_id, vote_window)
);

create table if not exists public.intercession_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete set null,
  topic_id text references public.intercession_topics(id) on delete set null,
  country_code text check (country_code is null or char_length(country_code) = 2),
  started_at timestamptz not null default now(),
  completed_at timestamptz,
  duration_seconds integer not null default 600 check (duration_seconds between 60 and 7200)
);

create index if not exists intercession_sessions_started_idx on public.intercession_sessions(started_at desc);
create index if not exists intercession_sessions_country_idx on public.intercession_sessions(country_code, started_at desc);

alter table public.intercession_topics enable row level security;
alter table public.intercession_votes enable row level security;
alter table public.intercession_sessions enable row level security;

drop policy if exists "intercession_topics_read" on public.intercession_topics;
create policy "intercession_topics_read" on public.intercession_topics for select using (active = true);

drop policy if exists "intercession_votes_read" on public.intercession_votes;
create policy "intercession_votes_read" on public.intercession_votes for select using (true);
drop policy if exists "intercession_votes_own_insert" on public.intercession_votes;
create policy "intercession_votes_own_insert" on public.intercession_votes for insert with check (auth.uid() = user_id);

drop policy if exists "intercession_sessions_own_insert" on public.intercession_sessions;
create policy "intercession_sessions_own_insert" on public.intercession_sessions for insert with check (auth.uid() = user_id);
drop policy if exists "intercession_sessions_own_update" on public.intercession_sessions;
create policy "intercession_sessions_own_update" on public.intercession_sessions for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

create or replace view public.intercession_country_activity as
select country_code, count(*)::integer as praying_count
from public.intercession_sessions
where completed_at is null and started_at > now() - interval '12 minutes' and country_code is not null
group by country_code;

grant select on public.intercession_country_activity to anon, authenticated;
