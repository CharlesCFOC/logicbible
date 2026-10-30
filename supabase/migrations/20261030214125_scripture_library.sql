-- Public-domain Bible library. Only verified versions are visible to readers.
create table public.scripture_versions (
  id text primary key,
  name text not null,
  language text not null,
  source_url text not null,
  license_url text not null,
  license text not null,
  source_sha256 text not null check (source_sha256 ~ '^[a-f0-9]{64}$'),
  imported_at timestamptz not null,
  published boolean not null default false,
  book_count integer not null check (book_count > 0),
  chapter_count integer not null check (chapter_count > 0),
  verse_count integer not null check (verse_count > 0)
);
create table public.scripture_books (
  version_id text not null references public.scripture_versions(id),
  book_id text not null,
  name text not null,
  position smallint not null check (position between 1 and 66),
  chapter_count smallint not null check (chapter_count > 0),
  primary key (version_id, book_id),
  unique (version_id, position)
);
create table public.scripture_chapters (
  version_id text not null,
  book_id text not null,
  chapter smallint not null check (chapter > 0),
  verse_count smallint not null check (verse_count > 0),
  primary key (version_id, book_id, chapter),
  foreign key (version_id, book_id) references public.scripture_books(version_id, book_id)
);
create table public.scripture_verses (
  version_id text not null,
  book_id text not null,
  chapter smallint not null,
  verse smallint not null check (verse > 0),
  text text not null check (length(btrim(text)) > 0),
  primary key (version_id, book_id, chapter, verse),
  foreign key (version_id, book_id, chapter)
    references public.scripture_chapters(version_id, book_id, chapter)
);
-- Composite primary keys also index chapter retrieval and all foreign keys.
alter table public.scripture_versions enable row level security;
alter table public.scripture_books enable row level security;
alter table public.scripture_chapters enable row level security;
alter table public.scripture_verses enable row level security;
revoke all on public.scripture_versions, public.scripture_books,
  public.scripture_chapters, public.scripture_verses from public, anon, authenticated;
grant select on public.scripture_versions, public.scripture_books,
  public.scripture_chapters, public.scripture_verses to anon, authenticated;
grant all on public.scripture_versions, public.scripture_books,
  public.scripture_chapters, public.scripture_verses to service_role;
create policy published_versions on public.scripture_versions
  for select to anon, authenticated using (published);
create policy published_books on public.scripture_books
  for select to anon, authenticated
  using (version_id in (select id from public.scripture_versions where published));
create policy published_chapters on public.scripture_chapters
  for select to anon, authenticated
  using (version_id in (select id from public.scripture_versions where published));
create policy published_verses on public.scripture_verses
  for select to anon, authenticated
  using (version_id in (select id from public.scripture_versions where published));
