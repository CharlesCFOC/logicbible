drop policy if exists "prayer_requests_read_active" on public.prayer_requests;
drop policy if exists "prayer_requests_read_own" on public.prayer_requests;

create policy "prayer_requests_read_public_wall"
on public.prayer_requests for select
using (status = 'active' or auth.uid() = author_id);
