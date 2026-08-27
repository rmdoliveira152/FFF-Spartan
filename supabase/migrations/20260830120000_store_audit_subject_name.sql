alter table public.admin_audit_events
add column if not exists subject_name text;

update public.admin_audit_events event
set subject_name = coalesce(
  event.changes #>> '{after,member_name}',
  event.changes #>> '{before,member_name}',
  case when event.resource_kind = 'member_performance_snapshots' then (
    select coalesce(
      member.member_name,
      member_event.changes #>> '{after,member_name}',
      member_event.changes #>> '{before,member_name}'
    )
    from (values (coalesce(
      event.changes #>> '{after,member_id}',
      event.changes #>> '{before,member_id}'
    )::uuid)) as target(member_id)
    left join public.alliance_members member on member.id = target.member_id
    left join lateral (
      select history.changes
      from public.admin_audit_events history
      where history.resource_kind = 'alliance_members'
        and history.resource_id = target.member_id
      order by history.id desc
      limit 1
    ) member_event on true
  ) end,
  case when event.resource_kind = 'r4_applications' then (
    select profile.member_name
    from public.profiles profile
    where profile.id = coalesce(
      event.changes #>> '{after,user_id}',
      event.changes #>> '{before,user_id}'
    )::uuid
  ) end
)
where event.subject_name is null;

create or replace function public.record_admin_audit_event()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  row_before jsonb := case when tg_op = 'INSERT' then null else to_jsonb(old) end;
  row_after jsonb := case when tg_op = 'DELETE' then null else to_jsonb(new) end;
  target_id uuid := coalesce((row_after ->> 'id')::uuid, (row_before ->> 'id')::uuid);
  target_member_id uuid;
  audit_subject_name text;
begin
  if tg_table_name in ('profiles', 'alliance_members') then
    audit_subject_name := coalesce(row_after ->> 'member_name', row_before ->> 'member_name');
  elsif tg_table_name = 'member_performance_snapshots' then
    target_member_id := coalesce((row_after ->> 'member_id')::uuid, (row_before ->> 'member_id')::uuid);
    select member.member_name into audit_subject_name
    from public.alliance_members member
    where member.id = target_member_id;
  elsif tg_table_name = 'r4_applications' then
    select profile.member_name into audit_subject_name
    from public.profiles profile
    where profile.id = coalesce((row_after ->> 'user_id')::uuid, (row_before ->> 'user_id')::uuid);
  end if;

  insert into public.admin_audit_events (actor_id, action, resource_kind, resource_id, subject_name, changes)
  values (auth.uid(), lower(tg_op), tg_table_name, target_id, audit_subject_name, jsonb_build_object('before', row_before, 'after', row_after));
  return coalesce(new, old);
end;
$$;

revoke all on function public.record_admin_audit_event() from public, anon, authenticated;