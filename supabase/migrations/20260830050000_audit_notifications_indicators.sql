create table if not exists public.admin_audit_events (
  id bigint generated always as identity primary key,
  actor_id uuid references public.profiles(id) on delete set null,
  action text not null,
  resource_kind text not null,
  resource_id uuid,
  changes jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists admin_audit_events_created_idx
on public.admin_audit_events (created_at desc);

alter table public.admin_audit_events enable row level security;

create policy "administrators_read_audit_events"
on public.admin_audit_events for select
to authenticated
using (public.is_admin());

grant select on public.admin_audit_events to authenticated;

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
begin
  insert into public.admin_audit_events (actor_id, action, resource_kind, resource_id, changes)
  values (auth.uid(), lower(tg_op), tg_table_name, target_id, jsonb_build_object('before', row_before, 'after', row_after));
  return coalesce(new, old);
end;
$$;

revoke all on function public.record_admin_audit_event() from public, anon, authenticated;

create trigger audit_profiles after update on public.profiles
for each row when (old is distinct from new) execute function public.record_admin_audit_event();
create trigger audit_alliance_members after insert or update or delete on public.alliance_members
for each row execute function public.record_admin_audit_event();
create trigger audit_polls after insert or update or delete on public.polls
for each row execute function public.record_admin_audit_event();
create trigger audit_board_news after insert or update or delete on public.board_news
for each row execute function public.record_admin_audit_event();
create trigger audit_r4_applications after update or delete on public.r4_applications
for each row execute function public.record_admin_audit_event();
create trigger audit_member_performance after insert or update or delete on public.member_performance_snapshots
for each row execute function public.record_admin_audit_event();

create table if not exists public.member_notifications (
  id bigint generated always as identity primary key,
  recipient_id uuid not null references public.profiles(id) on delete cascade,
  event_kind text not null,
  resource_kind text,
  resource_id uuid,
  actor_id uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  read_at timestamptz
);

create index if not exists member_notifications_recipient_idx
on public.member_notifications (recipient_id, created_at desc);

alter table public.member_notifications enable row level security;

create policy "members_read_own_notifications"
on public.member_notifications for select
to authenticated
using (recipient_id = auth.uid());

create policy "members_update_own_notifications"
on public.member_notifications for update
to authenticated
using (recipient_id = auth.uid())
with check (recipient_id = auth.uid());

grant select, update on public.member_notifications to authenticated;

do $$
begin
  if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'member_notifications') then
    alter publication supabase_realtime add table public.member_notifications;
  end if;
  if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'votes') then
    alter publication supabase_realtime add table public.votes;
  end if;
end;
$$;

create or replace function public.notify_approved_members()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  notification_kind text;
  resource_kind text := tg_table_name;
  resource_id uuid;
begin
  if tg_table_name = 'polls' then
    notification_kind := 'poll_created';
    resource_id := new.id;
  elsif tg_table_name = 'board_news' then
    if not new.published then return new; end if;
    notification_kind := 'news_published';
    resource_id := new.id;
  elsif tg_table_name = 'poll_comments' then
    notification_kind := 'comment_posted';
    resource_kind := 'poll';
    resource_id := new.poll_id;
  elsif tg_table_name = 'board_news_comments' then
    notification_kind := 'comment_posted';
    resource_kind := 'board_news';
    resource_id := new.news_id;
  else
    return new;
  end if;

  insert into public.member_notifications (recipient_id, event_kind, resource_kind, resource_id, actor_id)
  select profile.id, notification_kind, resource_kind, resource_id, auth.uid()
  from public.profiles profile
  where profile.active
    and (profile.registration_status = 'approved' or profile.role = 'admin')
    and profile.id is distinct from auth.uid();
  return new;
end;
$$;

create or replace function public.notify_account_change()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  notification_kind text;
begin
  if tg_table_name = 'r4_applications' and old.status is distinct from new.status and new.status <> 'pending' then
    notification_kind := 'r4_' || new.status;
    insert into public.member_notifications (recipient_id, event_kind, resource_kind, resource_id, actor_id)
    values (new.user_id, notification_kind, 'r4_application', new.id, auth.uid());
  elsif tg_table_name = 'profiles' and old.registration_status is distinct from new.registration_status then
    notification_kind := 'registration_' || new.registration_status;
    insert into public.member_notifications (recipient_id, event_kind, resource_kind, resource_id, actor_id)
    values (new.id, notification_kind, 'profile', new.id, auth.uid());
  end if;
  return new;
end;
$$;

revoke all on function public.notify_approved_members() from public, anon, authenticated;
revoke all on function public.notify_account_change() from public, anon, authenticated;

create trigger notify_new_poll after insert on public.polls
for each row execute function public.notify_approved_members();
create trigger notify_new_news after insert on public.board_news
for each row execute function public.notify_approved_members();
create trigger notify_poll_comment after insert on public.poll_comments
for each row execute function public.notify_approved_members();
create trigger notify_news_comment after insert on public.board_news_comments
for each row execute function public.notify_approved_members();
create trigger notify_r4_decision after update on public.r4_applications
for each row execute function public.notify_account_change();
create trigger notify_registration_decision after update on public.profiles
for each row execute function public.notify_account_change();

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
    coalesce(current_date - latest.snapshot_date, 999999)::integer
  from public.alliance_members member
  left join ranked latest on latest.member_id = member.id and latest.position = 1
  left join ranked previous on previous.member_id = member.id and previous.position = 2
  where member.active
  order by coalesce(latest.snapshot_date, date '1900-01-01') asc, member.member_name;
end;
$$;

revoke all on function public.admin_performance_indicators() from public, anon;
grant execute on function public.admin_performance_indicators() to authenticated;
