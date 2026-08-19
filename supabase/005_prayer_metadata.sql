alter table public.prayer_requests
  add column if not exists category text not null default 'general',
  add column if not exists urgent boolean not null default false;
