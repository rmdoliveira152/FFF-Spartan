drop function if exists public.poll_results(uuid);

create function public.poll_results(requested_poll uuid)
returns table (option_id uuid, vote_count bigint, voter_names text[])
language sql
stable
security definer
set search_path = ''
as $$
  select
    options.id,
    count(votes.option_id),
    case
      when public.is_admin()
        or exists (
          select 1
          from public.profiles current_profile
          where current_profile.id = auth.uid()
            and current_profile.active
            and current_profile.registration_status = 'approved'
        )
      then coalesce(
        array_agg(voter_profile.member_name order by voter_profile.member_name)
          filter (where votes.user_id is not null),
        '{}'::text[]
      )
      else '{}'::text[]
    end
  from public.poll_options options
  join public.polls poll on poll.id = options.poll_id
  left join public.votes votes on votes.option_id = options.id
  left join public.profiles voter_profile on voter_profile.id = votes.user_id
  where options.poll_id = requested_poll
    and (poll.active or public.is_admin())
  group by options.id, options.position
  order by options.position;
$$;

revoke all on function public.poll_results(uuid) from public;
grant execute on function public.poll_results(uuid) to anon, authenticated;