create or replace function public.review_registration(
  requested_profile uuid,
  decision public.registration_status
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  target_status public.registration_status;
  target_member_id uuid;
  target_member_name text;
  resolved_member_id uuid;
  resolved_member_name text;
begin
  if not public.is_admin() then raise exception 'Administrator access required'; end if;

  select profile.registration_status, profile.alliance_member_id, profile.member_name
  into target_status, target_member_id, target_member_name
  from public.profiles profile
  where profile.id = requested_profile and profile.role = 'member'
  for update;

  if not found then raise exception 'Member account not found'; end if;

  if decision = 'approved' then
    if target_status not in ('pending', 'rejected') then
      raise exception 'Only pending or rejected registrations can be approved';
    end if;

    select member.id, member.member_name
    into resolved_member_id, resolved_member_name
    from public.alliance_members member
    where member.active
      and (
        (target_member_id is not null and member.id = target_member_id)
        or (target_member_id is null and member.member_name = target_member_name)
      )
    for update;

    if resolved_member_id is null then
      raise exception 'Alliance member is no longer available';
    end if;

    if exists (
      select 1
      from public.profiles profile
      where profile.id <> requested_profile
        and profile.alliance_member_id = resolved_member_id
        and profile.registration_status in ('pending', 'approved')
    ) then
      raise exception 'Alliance member is already linked to another account';
    end if;

    update public.profiles
    set registration_status = 'approved',
        active = true,
        alliance_member_id = resolved_member_id,
        member_name = resolved_member_name
    where id = requested_profile;
  elsif decision = 'rejected' then
    if target_status <> 'pending' then
      raise exception 'Only pending registrations can be rejected';
    end if;

    update public.profiles
    set registration_status = 'rejected', active = false
    where id = requested_profile;
  else
    raise exception 'Decision must be approved or rejected';
  end if;
end;
$$;

revoke all on function public.review_registration(uuid, public.registration_status) from public, anon, authenticated;
grant execute on function public.review_registration(uuid, public.registration_status) to authenticated;