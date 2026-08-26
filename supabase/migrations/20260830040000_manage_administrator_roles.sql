create or replace function public.set_profile_active(
  requested_profile uuid,
  requested_active boolean
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  target_role public.member_role;
begin
  if not public.is_admin() then
    raise exception 'Administrator access required';
  end if;

  if requested_profile = auth.uid() then
    raise exception 'Administrators cannot change their own access';
  end if;

  perform pg_advisory_xact_lock(hashtext('public.profiles.admin-role'));

  select role
  into target_role
  from public.profiles
  where id = requested_profile
    and registration_status = 'approved'
  for update;

  if not found then
    raise exception 'Approved account not found';
  end if;

  if not requested_active and target_role = 'admin' and not exists (
    select 1
    from public.profiles
    where role = 'admin'
      and active
      and registration_status = 'approved'
      and id <> requested_profile
  ) then
    raise exception 'The last active administrator cannot be deactivated';
  end if;

  update public.profiles
  set active = requested_active
  where id = requested_profile;
end;
$$;

create or replace function public.set_profile_role(
  requested_profile uuid,
  requested_role public.member_role
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  target_role public.member_role;
  target_active boolean;
  target_status public.registration_status;
begin
  if not public.is_admin() then
    raise exception 'Administrator access required';
  end if;

  if requested_profile = auth.uid() then
    raise exception 'Administrators cannot change their own role';
  end if;

  perform pg_advisory_xact_lock(hashtext('public.profiles.admin-role'));

  select role, active, registration_status
  into target_role, target_active, target_status
  from public.profiles
  where id = requested_profile
  for update;

  if not found then
    raise exception 'Account not found';
  end if;

  if target_role = requested_role then
    return;
  end if;

  if requested_role = 'admin' and (not target_active or target_status <> 'approved') then
    raise exception 'Only active approved accounts can become administrators';
  end if;

  if requested_role = 'member' and target_role = 'admin' and not exists (
    select 1
    from public.profiles
    where role = 'admin'
      and active
      and registration_status = 'approved'
      and id <> requested_profile
  ) then
    raise exception 'The last active administrator cannot be demoted';
  end if;

  update public.profiles
  set role = requested_role
  where id = requested_profile;
end;
$$;

revoke all on function public.set_profile_active(uuid, boolean) from public, anon;
revoke all on function public.set_profile_role(uuid, public.member_role) from public, anon;
grant execute on function public.set_profile_active(uuid, boolean) to authenticated;
grant execute on function public.set_profile_role(uuid, public.member_role) to authenticated;

revoke update on public.profiles from authenticated;