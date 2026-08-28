update public.member_formation_powers as formation
set combat_power = formation.combat_power * 1000
from public.member_performance_snapshots as snapshot
where snapshot.id = formation.snapshot_id
  and snapshot.recorded_at < timestamptz '2026-08-28 20:48:51+00'
  and formation.combat_power between 1 and 999999;