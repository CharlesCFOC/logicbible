alter table public.church_study_activities
  add column if not exists enabled boolean not null default true;

create table public.church_study_translations (
  study_id uuid not null references public.church_studies(id) on delete cascade,
  locale text not null check (char_length(btrim(locale)) between 2 and 60),
  translated_content jsonb not null,
  updated_by uuid references auth.users(id) on delete set null,
  updated_at timestamptz not null default now(),
  primary key (study_id, locale)
);

alter table public.church_study_translations enable row level security;
revoke all on public.church_study_translations from anon, authenticated;
grant select on public.church_study_translations to authenticated;

create policy "members read translations of published studies"
on public.church_study_translations for select to authenticated
using (
  exists (
    select 1 from public.church_studies s
    where s.id = study_id and s.status <> 'draft'
      and (select private.is_church_member(s.church_id))
  )
);

create trigger church_study_translations_updated_at
before update on public.church_study_translations
for each row execute function public.set_church_study_updated_at();

