alter table public.bible_sessions
  add column projection_slides text[] not null default '{}',
  add column projection_index integer not null default 0,
  add column projection_updated_at timestamptz not null default now();

alter table public.bible_sessions
  add constraint bible_sessions_projection_index_valid
  check (projection_index >= 0 and (cardinality(projection_slides) = 0 or projection_index < cardinality(projection_slides)));
