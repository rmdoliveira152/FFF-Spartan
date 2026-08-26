alter table public.alliance_members
  add column if not exists performance_updated_at timestamptz;

create table if not exists public.member_performance_snapshots (
  id uuid primary key default gen_random_uuid(),
  member_id uuid not null references public.alliance_members(id) on delete cascade,
  snapshot_date date not null,
  combat_power bigint not null check (combat_power >= 0),
  kills bigint not null check (kills >= 0),
  weekly_contribution bigint not null check (weekly_contribution >= 0),
  recorded_by uuid not null references public.profiles(id),
  recorded_at timestamptz not null default now(),
  unique (member_id, snapshot_date)
);

create table if not exists public.member_formation_powers (
  snapshot_id uuid not null references public.member_performance_snapshots(id) on delete cascade,
  formation_number smallint not null check (formation_number between 1 and 4),
  combat_power bigint not null check (combat_power >= 0),
  primary key (snapshot_id, formation_number)
);

create index if not exists member_performance_member_date_idx
on public.member_performance_snapshots (member_id, snapshot_date desc);

alter table public.member_performance_snapshots enable row level security;
alter table public.member_formation_powers enable row level security;

drop policy if exists "member_performance_verified_read" on public.member_performance_snapshots;
create policy "member_performance_verified_read"
on public.member_performance_snapshots for select
to authenticated
using (
  public.is_admin()
  or exists (
    select 1 from public.profiles
    where id = auth.uid() and active and registration_status = 'approved'
  )
);

drop policy if exists "member_formations_verified_read" on public.member_formation_powers;
create policy "member_formations_verified_read"
on public.member_formation_powers for select
to authenticated
using (
  exists (
    select 1 from public.member_performance_snapshots snapshot
    where snapshot.id = snapshot_id
  )
);

grant select on public.member_performance_snapshots, public.member_formation_powers to authenticated;

create or replace function public.save_member_performance(
  requested_member uuid,
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
  saved_snapshot uuid;
  formation_index integer;
begin
  if not public.is_admin() then raise exception 'Administrator access required'; end if;
  if requested_date is null or requested_date > current_date then raise exception 'Snapshot date must not be in the future'; end if;
  if requested_combat_power < 0 or requested_kills < 0 or requested_weekly_contribution < 0 then raise exception 'Performance values must not be negative'; end if;
  if array_length(requested_formations, 1) <> 4 or exists (select 1 from unnest(requested_formations) value where value < 0) then
    raise exception 'Exactly four non-negative formation values are required';
  end if;
  if not exists (select 1 from public.alliance_members where id = requested_member) then raise exception 'Alliance member not found'; end if;

  insert into public.member_performance_snapshots (
    member_id, snapshot_date, combat_power, kills, weekly_contribution, recorded_by
  ) values (
    requested_member, requested_date, requested_combat_power, requested_kills, requested_weekly_contribution, auth.uid()
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
  where id = requested_member;

  return saved_snapshot;
end;
$$;

revoke all on function public.save_member_performance(uuid, date, bigint, bigint, bigint, bigint[]) from public, anon, authenticated;
grant execute on function public.save_member_performance(uuid, date, bigint, bigint, bigint, bigint[]) to authenticated;

create or replace function public.member_performance_history(requested_member uuid)
returns table (
  id uuid,
  snapshot_date date,
  combat_power bigint,
  kills bigint,
  weekly_contribution bigint,
  formation_1 bigint,
  formation_2 bigint,
  formation_3 bigint,
  formation_4 bigint,
  recorded_at timestamptz
)
language sql
stable
security definer
set search_path = ''
as $$
  select snapshot.id,
         snapshot.snapshot_date,
         snapshot.combat_power,
         snapshot.kills,
         snapshot.weekly_contribution,
         max(formation.combat_power) filter (where formation.formation_number = 1),
         max(formation.combat_power) filter (where formation.formation_number = 2),
         max(formation.combat_power) filter (where formation.formation_number = 3),
         max(formation.combat_power) filter (where formation.formation_number = 4),
         snapshot.recorded_at
  from public.member_performance_snapshots snapshot
  left join public.member_formation_powers formation on formation.snapshot_id = snapshot.id
  where snapshot.member_id = requested_member
    and (
      public.is_admin()
      or exists (
        select 1 from public.profiles
        where id = auth.uid() and active and registration_status = 'approved'
      )
    )
  group by snapshot.id
  order by snapshot.snapshot_date;
$$;

revoke all on function public.member_performance_history(uuid) from public, anon, authenticated;
grant execute on function public.member_performance_history(uuid) to authenticated;