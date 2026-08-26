create or replace function public.notify_account_change()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  notification_kind text;
  row_before jsonb := to_jsonb(old);
  row_after jsonb := to_jsonb(new);
begin
  if tg_table_name = 'r4_applications'
    and row_before ->> 'status' is distinct from row_after ->> 'status'
    and row_after ->> 'status' <> 'pending'
  then
    notification_kind := 'r4_' || (row_after ->> 'status');
    insert into public.member_notifications (recipient_id, event_kind, resource_kind, resource_id, actor_id)
    values (
      (row_after ->> 'user_id')::uuid,
      notification_kind,
      'r4_application',
      (row_after ->> 'id')::uuid,
      auth.uid()
    );
  elsif tg_table_name = 'profiles'
    and row_before ->> 'registration_status' is distinct from row_after ->> 'registration_status'
  then
    notification_kind := 'registration_' || (row_after ->> 'registration_status');
    insert into public.member_notifications (recipient_id, event_kind, resource_kind, resource_id, actor_id)
    values (
      (row_after ->> 'id')::uuid,
      notification_kind,
      'profile',
      (row_after ->> 'id')::uuid,
      auth.uid()
    );
  end if;
  return new;
end;
$$;

revoke all on function public.notify_account_change() from public, anon, authenticated;