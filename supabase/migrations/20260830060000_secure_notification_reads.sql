drop policy if exists "members_update_own_notifications" on public.member_notifications;
revoke update on public.member_notifications from authenticated;

create or replace function public.mark_member_notifications_read()
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  updated_count integer;
begin
  update public.member_notifications
  set read_at = now()
  where recipient_id = auth.uid() and read_at is null;
  get diagnostics updated_count = row_count;
  return updated_count;
end;
$$;

revoke all on function public.mark_member_notifications_read() from public, anon;
grant execute on function public.mark_member_notifications_read() to authenticated;

create or replace function public.notify_approved_members()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  notification_kind text;
  resource_kind text := tg_table_name;
  resource_id uuid;
begin
  if tg_table_name = 'polls' then
    notification_kind := 'poll_created';
    resource_id := new.id;
  elsif tg_table_name = 'board_news' then
    if not new.published or (tg_op = 'UPDATE' and old.published) then return new; end if;
    notification_kind := 'news_published';
    resource_id := new.id;
  elsif tg_table_name = 'poll_comments' then
    notification_kind := 'comment_posted';
    resource_kind := 'poll';
    resource_id := new.poll_id;
  elsif tg_table_name = 'board_news_comments' then
    notification_kind := 'comment_posted';
    resource_kind := 'board_news';
    resource_id := new.news_id;
  else
    return new;
  end if;

  insert into public.member_notifications (recipient_id, event_kind, resource_kind, resource_id, actor_id)
  select profile.id, notification_kind, resource_kind, resource_id, auth.uid()
  from public.profiles profile
  where profile.active
    and (profile.registration_status = 'approved' or profile.role = 'admin')
    and profile.id is distinct from auth.uid();
  return new;
end;
$$;

drop trigger if exists notify_new_news on public.board_news;
create trigger notify_new_news after insert or update of published on public.board_news
for each row execute function public.notify_approved_members();
