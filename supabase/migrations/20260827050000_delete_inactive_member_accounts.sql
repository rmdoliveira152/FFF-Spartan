alter table public.member_performance_snapshots
  alter column recorded_by drop not null;

alter table public.member_performance_snapshots
  drop constraint if exists member_performance_snapshots_recorded_by_fkey;

alter table public.member_performance_snapshots
  add constraint member_performance_snapshots_recorded_by_fkey
  foreign key (recorded_by) references public.profiles(id) on delete set null;

alter table public.polls alter column created_by drop not null;
alter table public.polls drop constraint if exists polls_created_by_fkey;
alter table public.polls
  add constraint polls_created_by_fkey
  foreign key (created_by) references public.profiles(id) on delete set null;

alter table public.board_news alter column created_by drop not null;
alter table public.board_news drop constraint if exists board_news_created_by_fkey;
alter table public.board_news
  add constraint board_news_created_by_fkey
  foreign key (created_by) references public.profiles(id) on delete set null;

alter table public.r4_applications drop constraint if exists r4_applications_reviewed_by_fkey;
alter table public.r4_applications
  add constraint r4_applications_reviewed_by_fkey
  foreign key (reviewed_by) references public.profiles(id) on delete set null;

create or replace function public.delete_inactive_member_account(requested_profile uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  target_role public.member_role;
  target_active boolean;
begin
  if not public.is_admin() then raise exception 'Administrator access required'; end if;
  if requested_profile = auth.uid() then raise exception 'The current account cannot be deleted'; end if;

  select role, active into target_role, target_active
  from public.profiles
  where id = requested_profile;

  if not found then raise exception 'Member account not found'; end if;
  if target_role <> 'member' then raise exception 'Administrator accounts cannot be deleted here'; end if;
  if target_active then raise exception 'Only inactive member accounts can be deleted'; end if;

  delete from auth.users where id = requested_profile;

  if found then return; end if;
  raise exception 'Authentication account not found';
end;
$$;

revoke all on function public.delete_inactive_member_account(uuid) from public, anon, authenticated;
grant execute on function public.delete_inactive_member_account(uuid) to authenticated;