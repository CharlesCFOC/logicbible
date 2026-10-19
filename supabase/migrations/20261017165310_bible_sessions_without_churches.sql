create table public.bible_sessions (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(btrim(name)) between 2 and 120),
  access_code char(8) not null unique check (access_code ~ '^[0-9]{8}$'),
  admin_password_salt text not null,
  admin_password_hash text not null,
  scheduled_at timestamptz,
  status text not null default 'scheduled' check (status in ('scheduled', 'live', 'ended')),
  created_at timestamptz not null default now(),
  started_at timestamptz,
  ended_at timestamptz
);

create index bible_sessions_scheduled_idx on public.bible_sessions(scheduled_at) where status = 'scheduled';

alter table public.bible_sessions enable row level security;
revoke all on public.bible_sessions from anon, authenticated;
grant all on public.bible_sessions to service_role;

notify pgrst, 'reload schema';
