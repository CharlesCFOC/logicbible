-- Server-only, persistent quotas. One reservation per provider call, including retries.
create table public.ai_usage_buckets (
  bucket_key text not null,
  window_start timestamptz not null,
  used integer not null default 0 check (used >= 0),
  primary key (bucket_key, window_start)
);
alter table public.ai_usage_buckets enable row level security;
revoke all on public.ai_usage_buckets from public, anon, authenticated;
grant select, insert, update, delete on public.ai_usage_buckets to service_role;

create function public.reserve_ai_call(actor_key text, hourly_limit integer, daily_limit integer, global_daily_limit integer)
returns jsonb language plpgsql security invoker
set search_path = '' set timezone = 'UTC'
as $$
declare
  current_time_utc timestamptz := now();
  day_start timestamptz := date_trunc('day', current_time_utc);
  hour_start timestamptz := date_trunc('hour', current_time_utc);
  global_used integer;
  actor_hour_used integer;
  actor_day_used integer;
  retry_seconds integer;
begin
  if actor_key is null or actor_key !~ '^(user|guest):[a-zA-Z0-9-]{1,80}$'
    or hourly_limit is null or hourly_limit < 1 or hourly_limit > 1000000
    or daily_limit is null or daily_limit < 1 or daily_limit > 1000000
    or global_daily_limit is null or global_daily_limit < 1 or global_daily_limit > 1000000 then
    raise exception 'Invalid quota configuration';
  end if;
  insert into public.ai_usage_buckets values ('global:day', day_start, 0) on conflict do nothing;
  -- All callers lock this row first: limits cannot be exceeded by concurrent instances.
  select used into global_used from public.ai_usage_buckets
    where bucket_key = 'global:day' and window_start = day_start for update;
  select coalesce(max(used), 0) into actor_hour_used from public.ai_usage_buckets
    where bucket_key = actor_key || ':hour' and window_start = hour_start;
  select coalesce(max(used), 0) into actor_day_used from public.ai_usage_buckets
    where bucket_key = actor_key || ':day' and window_start = day_start;
  if global_used >= global_daily_limit or actor_day_used >= daily_limit then
    retry_seconds := ceil(extract(epoch from day_start + interval '1 day' - current_time_utc));
  elsif actor_hour_used >= hourly_limit then
    retry_seconds := ceil(extract(epoch from hour_start + interval '1 hour' - current_time_utc));
  end if;
  if retry_seconds is not null then
    return jsonb_build_object('allowed', false, 'retry_after', retry_seconds);
  end if;
  insert into public.ai_usage_buckets as bucket values
    ('global:day', day_start, 1), (actor_key || ':day', day_start, 1), (actor_key || ':hour', hour_start, 1)
    on conflict (bucket_key, window_start) do update set used = bucket.used + 1;
  if global_used = 0 then
    delete from public.ai_usage_buckets where window_start < day_start - interval '2 days';
  end if;
  return jsonb_build_object('allowed', true);
end;
$$;
revoke all on function public.reserve_ai_call(text, integer, integer, integer) from public, anon, authenticated;
grant execute on function public.reserve_ai_call(text, integer, integer, integer) to service_role;

-- Aggregate votes inside Postgres; never transfer every voter's state to each request.
create index if not exists user_app_state_vote_window_idx on public.user_app_state(state_key, updated_at)
  where state_key like 'intercession-vote:%';
create function public.intercession_vote_summary(session_start_ms bigint, viewer_id uuid default null)
returns jsonb language sql stable security invoker set search_path = '' as $$
  with windows as (
    select session_start_ms as start_ms union all select session_start_ms + 600000
  ), counts as (
    select w.start_ms, s.payload->>'topicId' as topic_id, count(*) as votes
    from windows w join public.user_app_state s
      on s.state_key = 'intercession-vote:' || w.start_ms::text
      and s.state_key like 'intercession-vote:%'
      and s.updated_at >= to_timestamp((w.start_ms - 600000) / 1000.0)
      and s.updated_at < to_timestamp(w.start_ms / 1000.0)
    group by w.start_ms, s.payload->>'topicId'
  )
  select jsonb_build_object(
    'counts', coalesce((select jsonb_agg(jsonb_build_object('sessionStart', start_ms, 'topicId', topic_id, 'count', votes)) from counts), '[]'::jsonb),
    'ownVote', (select payload->>'topicId' from public.user_app_state
      where user_id = viewer_id and state_key = 'intercession-vote:' || (session_start_ms + 600000)::text)
  );
$$;
revoke all on function public.intercession_vote_summary(bigint, uuid) from public, anon, authenticated;
grant execute on function public.intercession_vote_summary(bigint, uuid) to service_role;
notify pgrst, 'reload schema';
