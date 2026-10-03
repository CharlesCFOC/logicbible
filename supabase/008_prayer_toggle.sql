create or replace function public.unpray_for_request(request_uuid uuid)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  new_count integer;
begin
  delete from public.prayer_interactions
  where request_id = request_uuid and user_id = auth.uid();

  if found then
    update public.prayer_requests
    set prayer_count = greatest(prayer_count - 1, 0),
        updated_at = now()
    where id = request_uuid and status = 'active'
    returning prayer_count into new_count;
  else
    select prayer_count into new_count
    from public.prayer_requests
    where id = request_uuid;
  end if;

  return coalesce(new_count, 0);
end;
$$;

revoke execute on function public.unpray_for_request(uuid) from public;
grant execute on function public.unpray_for_request(uuid) to authenticated;
