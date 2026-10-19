alter table public.bible_sessions
  add column if not exists source_document_name text,
  add column if not exists source_document_path text,
  add column if not exists course_content jsonb not null default '{}'::jsonb,
  add column if not exists projection_media jsonb not null default '[]'::jsonb,
  add column if not exists projection_activity jsonb;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'bible-session-courses', 'bible-session-courses', false, 2621440,
  array['application/pdf', 'image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update set
  public = false,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

notify pgrst, 'reload schema';
