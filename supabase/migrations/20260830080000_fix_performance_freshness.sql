create or replace function public.admin_performance_indicators()
returns table (
  member_id uuid,
  member_name text,
  latest_date date,
  previous_date date,
  combat_power bigint,
  combat_power_change bigint,
  kills_change bigint,
  contribution_change bigint,
  days_since_update integer
)
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if not public.is_admin() then raise exception 'Administrator access required'; end if;
  return query
  with ranked as (
    select snapshot.*,
      row_number() over (partition by snapshot.member_id order by snapshot.snapshot_date desc) as position
    from public.member_performance_snapshots snapshot
  )
  select member.id, member.member_name,
    latest.snapshot_date, previous.snapshot_date,
    coalesce(latest.combat_power, member.combat_power),
    coalesce(latest.combat_power - previous.combat_power, 0),
    coalesce(latest.kills - previous.kills, 0),
    coalesce(latest.weekly_contribution - previous.weekly_contribution, 0),
    (current_date - coalesce(
      latest.snapshot_date,
      member.performance_updated_at::date,
      member.created_at::date
    ))::integer
  from public.alliance_members member
  left join ranked latest on latest.member_id = member.id and latest.position = 1
  left join ranked previous on previous.member_id = member.id and previous.position = 2
  where member.active
  order by coalesce(
    latest.snapshot_date,
    member.performance_updated_at::date,
    member.created_at::date
  ) asc, member.member_name;
end;
$$;

revoke all on function public.admin_performance_indicators() from public, anon;
grant execute on function public.admin_performance_indicators() to authenticated;