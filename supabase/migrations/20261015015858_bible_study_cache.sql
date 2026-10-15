create table if not exists public.bible_study_cache (
  cache_key text primary key check (cache_key ~ '^[a-f0-9]{64}$'),
  book text not null,
  chapter integer not null check (chapter > 0),
  version text not null,
  language text not null check (language in ('English', 'French')),
  study_tab text not null check (study_tab in ('biblical', 'historical', 'summary', 'veracity', 'manuscripts')),
  study jsonb not null check (jsonb_typeof(study) = 'object'),
  model text not null default '',
  prompt_version integer not null default 1,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.bible_study_cache enable row level security;

revoke all on table public.bible_study_cache from anon, authenticated;
grant select, insert, update on table public.bible_study_cache to service_role;
