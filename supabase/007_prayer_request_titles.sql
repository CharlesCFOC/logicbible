-- Add titles to existing prayer requests and keep future titles validated.
alter table public.prayer_requests
  add column if not exists title text;

update public.prayer_requests
set title = 'Prayer request'
where title is null or btrim(title) = '';

alter table public.prayer_requests
  alter column title set default 'Prayer request',
  alter column title set not null;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conrelid = 'public.prayer_requests'::regclass
      and conname = 'prayer_requests_title_length'
  ) then
    alter table public.prayer_requests
      add constraint prayer_requests_title_length
      check (char_length(title) between 1 and 120);
  end if;
end
$$;
