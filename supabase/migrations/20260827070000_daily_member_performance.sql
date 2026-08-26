create or replace function public.save_own_member_performance(
  requested_date date,
  requested_combat_power bigint,
  requested_kills bigint,
  requested_weekly_contribution bigint,
  requested_formations bigint[]
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  utc_today date := (now() at time zone 'UTC')::date;
  linked_member uuid;
  saved_snapshot uuid;
  formation_index integer;
begin
  select alliance_member_id into linked_member
  from public.profiles
  where id = auth.uid()
    and active
    and registration_status = 'approved';

  if linked_member is null then raise exception 'Approved active member account required'; end if;
  if requested_date not in (utc_today, utc_today - 1) then
    raise exception 'Only today or yesterday can be updated';
  end if;
  if requested_combat_power is null or requested_kills is null or requested_weekly_contribution is null
    or requested_combat_power < 0 or requested_kills < 0 or requested_weekly_contribution < 0 then
    raise exception 'Performance values must not be negative';
  end if;
  if coalesce(array_length(requested_formations, 1), 0) <> 4
    or exists (select 1 from unnest(requested_formations) value where value is null or value < 0) then
    raise exception 'Exactly four non-negative formation values are required';
  end if;

  insert into public.member_performance_snapshots (
    member_id, snapshot_date, combat_power, kills, weekly_contribution, recorded_by
  ) values (
    linked_member, requested_date, requested_combat_power, requested_kills, requested_weekly_contribution, auth.uid()
  )
  on conflict (member_id, snapshot_date) do update
  set combat_power = excluded.combat_power,
      kills = excluded.kills,
      weekly_contribution = excluded.weekly_contribution,
      recorded_by = auth.uid(),
      recorded_at = now()
  returning id into saved_snapshot;

  for formation_index in 1..4 loop
    insert into public.member_formation_powers (snapshot_id, formation_number, combat_power)
    values (saved_snapshot, formation_index, requested_formations[formation_index])
    on conflict (snapshot_id, formation_number) do update
    set combat_power = excluded.combat_power;
  end loop;

  update public.alliance_members
  set combat_power = requested_combat_power,
      kills = requested_kills,
      weekly_contribution = requested_weekly_contribution,
      performance_updated_at = now(),
      updated_at = now()
  where id = linked_member;

  return saved_snapshot;
end;
$$;

revoke all on function public.save_own_member_performance(date, bigint, bigint, bigint, bigint[]) from public, anon, authenticated;
grant execute on function public.save_own_member_performance(date, bigint, bigint, bigint, bigint[]) to authenticated;