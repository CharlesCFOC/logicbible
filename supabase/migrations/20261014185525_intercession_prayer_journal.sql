-- Public devotional content. Writes are reserved for the server/import tooling.
create table if not exists public.intercession_prayer_lines (
  theme_id text not null,
  focus_id text not null,
  language text not null default 'en' check (language = 'en'),
  sequence integer not null check (sequence between 0 and 11),
  body text not null check (char_length(body) between 12 and 600),
  updated_at timestamptz not null default now(),
  primary key (focus_id, language, sequence)
);
create index if not exists intercession_prayer_lines_theme_idx
  on public.intercession_prayer_lines (theme_id, language);
alter table public.intercession_prayer_lines enable row level security;
drop policy if exists intercession_prayer_lines_read on public.intercession_prayer_lines;
create policy intercession_prayer_lines_read
  on public.intercession_prayer_lines for select to anon, authenticated using (true);
revoke all on public.intercession_prayer_lines from anon, authenticated;
grant select on public.intercession_prayer_lines to anon, authenticated;
grant all on public.intercession_prayer_lines to service_role;
notify pgrst, 'reload schema';
