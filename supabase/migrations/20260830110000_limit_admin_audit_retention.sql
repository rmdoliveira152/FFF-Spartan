create extension if not exists pg_cron;

create or replace function public.purge_expired_admin_audit_events()
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  deleted_count integer;
begin
  delete from public.admin_audit_events
  where (resource_kind = 'member_performance_snapshots' and created_at < now() - interval '6 months')
     or (resource_kind <> 'member_performance_snapshots' and created_at < now() - interval '2 years');

  get diagnostics deleted_count = row_count;
  return deleted_count;
end;
$$;

revoke all on function public.purge_expired_admin_audit_events() from public, anon, authenticated;

do $$
declare
  existing_job bigint;
begin
  select jobid into existing_job
  from cron.job
  where jobname = 'purge-expired-admin-audit-events';

  if existing_job is not null then
    perform cron.unschedule(existing_job);
  end if;

  perform cron.schedule(
    'purge-expired-admin-audit-events',
    '15 3 1 * *',
    'select public.purge_expired_admin_audit_events()'
  );
end;
$$;