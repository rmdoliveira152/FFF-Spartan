create or replace function public.admin_member_last_logins()
returns table (
  member_id uuid,
  account_id uuid,
  last_sign_in_at timestamptz
)
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if not public.is_admin() then
    raise exception 'Administrator access required';
  end if;

  return query
  select member.id,
    profile.id,
    auth_user.last_sign_in_at
  from public.alliance_members member
  left join public.profiles profile on profile.alliance_member_id = member.id
  left join auth.users auth_user on auth_user.id = profile.id
  order by member.member_name;
end;
$$;

revoke all on function public.admin_member_last_logins() from public, anon;
grant execute on function public.admin_member_last_logins() to authenticated;