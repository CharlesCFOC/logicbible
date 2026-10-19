insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'church-study-files', 'church-study-files', false, 104857600,
  array[
    'application/pdf', 'text/plain',
    'image/jpeg', 'image/png', 'image/webp',
    'video/mp4', 'video/webm', 'video/quicktime',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ]
)
on conflict (id) do update set
  public = false,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

create table public.church_study_media (
  id uuid primary key default gen_random_uuid(),
  study_id uuid not null references public.church_studies(id) on delete cascade,
  object_path text not null unique,
  original_name text not null check (char_length(original_name) between 1 and 240),
  media_type text not null check (media_type in ('document', 'image', 'video')),
  is_ai_illustration boolean not null default false,
  created_by uuid not null references auth.users(id) on delete restrict,
  created_at timestamptz not null default now()
);

create or replace function private.try_uuid(value text)
returns uuid
language plpgsql immutable
set search_path = ''
as $$
begin
  return value::uuid;
exception when others then
  return null;
end;
$$;
revoke all on function private.try_uuid(text) from public, anon;
grant execute on function private.try_uuid(text) to authenticated;

alter table public.church_study_media enable row level security;
grant select, insert, delete on public.church_study_media to authenticated;

create policy "members read media of published studies"
on public.church_study_media for select to authenticated
using (
  exists (
    select 1 from public.church_studies s
    where s.id = study_id
      and ((select private.can_manage_church(s.church_id))
        or ((select private.is_church_member(s.church_id)) and s.status <> 'draft'))
  )
);

create policy "teachers add study media"
on public.church_study_media for insert to authenticated
with check (
  created_by = (select auth.uid())
  and exists (select 1 from public.church_studies s where s.id = study_id and (select private.can_manage_church(s.church_id)))
);

create policy "teachers remove study media"
on public.church_study_media for delete to authenticated
using (exists (select 1 from public.church_studies s where s.id = study_id and (select private.can_manage_church(s.church_id))));

create policy "church members read uploaded study files"
on storage.objects for select to authenticated
using (
  bucket_id = 'church-study-files'
  and exists (
    select 1 from public.church_studies s
    where s.id = private.try_uuid((storage.foldername(name))[2])
      and s.church_id = private.try_uuid((storage.foldername(name))[1])
      and ((select private.can_manage_church(s.church_id))
        or ((select private.is_church_member(s.church_id)) and s.status <> 'draft'))
  )
);

create policy "teachers upload study files"
on storage.objects for insert to authenticated
with check (
  bucket_id = 'church-study-files'
  and exists (
    select 1 from public.church_studies s
    where s.id = private.try_uuid((storage.foldername(name))[2])
      and s.church_id = private.try_uuid((storage.foldername(name))[1])
      and (select private.can_manage_church(s.church_id))
  )
);

create policy "teachers remove study files"
on storage.objects for delete to authenticated
using (
  bucket_id = 'church-study-files'
  and exists (
    select 1 from public.church_studies s
    where s.id = private.try_uuid((storage.foldername(name))[2])
      and s.church_id = private.try_uuid((storage.foldername(name))[1])
      and (select private.can_manage_church(s.church_id))
  )
);
