create or replace function public.notify_admins_pending_registration()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.registration_status <> 'pending' then
    return new;
  end if;

  insert into public.member_notifications (recipient_id, event_kind, resource_kind, resource_id, actor_id)
  select administrator.id, 'registration_pending', 'profile', new.id, new.id
  from public.profiles administrator
  where administrator.role = 'admin'
    and administrator.active
    and administrator.registration_status = 'approved';

  return new;
end;
$$;

revoke all on function public.notify_admins_pending_registration() from public, anon, authenticated;

insert into public.member_notifications (recipient_id, event_kind, resource_kind, resource_id, actor_id)
select administrator.id, 'registration_pending', 'profile', pending.id, pending.id
from public.profiles administrator
cross join public.profiles pending
where administrator.role = 'admin'
  and administrator.active
  and administrator.registration_status = 'approved'
  and pending.registration_status = 'pending'
  and not exists (
    select 1
    from public.member_notifications notification
    where notification.recipient_id = administrator.id
      and notification.event_kind = 'registration_pending'
      and notification.resource_kind = 'profile'
      and notification.resource_id = pending.id
  );

drop trigger if exists notify_admins_pending_registration on public.profiles;
create trigger notify_admins_pending_registration
after insert on public.profiles
for each row execute function public.notify_admins_pending_registration();