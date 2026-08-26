create or replace function public.update_poll(
  requested_poll uuid,
  poll_question text,
  option_labels text[],
  poll_closes_at timestamptz default null
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  poll_has_votes boolean;
begin
  if not public.is_admin() then
    raise exception 'Administrator access required';
  end if;

  if length(trim(poll_question)) not between 5 and 240 or coalesce(cardinality(option_labels), 0) not between 2 and 12 then
    raise exception 'A poll needs a question and between 2 and 12 options';
  end if;

  perform 1
  from public.polls
  where id = requested_poll
  for update;

  if not found then
    raise exception 'Poll not found';
  end if;

  select exists (
    select 1
    from public.votes
    where poll_id = requested_poll
  ) into poll_has_votes;

  if poll_has_votes and option_labels is distinct from array(
    select label
    from public.poll_options
    where poll_id = requested_poll
    order by position
  ) then
    raise exception 'Poll options cannot be changed after voting has started';
  end if;

  update public.polls
  set question = trim(poll_question),
      closes_at = poll_closes_at
  where id = requested_poll;

  if not poll_has_votes then
    delete from public.poll_options
    where poll_id = requested_poll;

    insert into public.poll_options (poll_id, label, position)
    select requested_poll, trim(option_label), option_position::smallint
    from unnest(option_labels) with ordinality as supplied(option_label, option_position)
    where length(trim(option_label)) > 0;

    if (select count(*) from public.poll_options where poll_id = requested_poll) <> cardinality(option_labels) then
      raise exception 'Poll options cannot be empty';
    end if;
  end if;
end;
$$;

revoke all on function public.update_poll(uuid, text, text[], timestamptz) from public, anon;
grant execute on function public.update_poll(uuid, text, text[], timestamptz) to authenticated;
revoke insert, update, delete on public.poll_options from authenticated;