create extension if not exists pgcrypto;

create type public.member_role as enum ('member', 'admin');
create type public.application_status as enum ('pending', 'approved', 'rejected');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  member_name text not null unique,
  role public.member_role not null default 'member',
  active boolean not null default false,
  created_at timestamptz not null default now()
);

create table public.polls (
  id uuid primary key default gen_random_uuid(),
  question text not null check (length(question) between 5 and 240),
  active boolean not null default true,
  closes_at timestamptz,
  created_by uuid not null references public.profiles(id),
  created_at timestamptz not null default now()
);

create table public.poll_options (
  id uuid primary key default gen_random_uuid(),
  poll_id uuid not null references public.polls(id) on delete cascade,
  label text not null check (length(label) between 1 and 120),
  position smallint not null check (position between 1 and 12),
  unique (poll_id, position)
);

create table public.votes (
  poll_id uuid not null references public.polls(id) on delete cascade,
  option_id uuid not null references public.poll_options(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (poll_id, user_id)
);

create table public.r4_applications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  reason text not null check (length(reason) between 10 and 2000),
  experience text not null check (length(experience) between 10 and 2000),
  availability text not null check (length(availability) between 2 and 120),
  status public.application_status not null default 'pending',
  reviewed_by uuid references public.profiles(id),
  reviewed_at timestamptz,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;
alter table public.polls enable row level security;
alter table public.poll_options enable row level security;
alter table public.votes enable row level security;
alter table public.r4_applications enable row level security;

create or replace function public.is_admin(check_user uuid default auth.uid())
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.profiles
    where id = check_user and role = 'admin' and active
  );
$$;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, member_name)
  values (
    new.id,
    coalesce(nullif(new.raw_user_meta_data ->> 'member_name', ''), split_part(new.email, '@', 1))
  );
  return new;
end;
$$;

create trigger on_auth_user_created
after insert on auth.users
for each row execute procedure public.handle_new_user();

create policy "profiles_read_own_or_admin"
on public.profiles for select
to authenticated
using (id = auth.uid() or public.is_admin());

create policy "profiles_admin_update"
on public.profiles for update
to authenticated
using (public.is_admin())
with check (public.is_admin());

create policy "polls_public_read"
on public.polls for select
to anon, authenticated
using (true);

create policy "poll_options_public_read"
on public.poll_options for select
to anon, authenticated
using (true);

create policy "polls_admin_insert"
on public.polls for insert
to authenticated
with check (public.is_admin() and created_by = auth.uid());

create policy "polls_admin_update"
on public.polls for update
to authenticated
using (public.is_admin())
with check (public.is_admin());

create policy "polls_admin_delete"
on public.polls for delete
to authenticated
using (public.is_admin());

create policy "poll_options_admin_manage"
on public.poll_options for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

create policy "votes_read_own_or_admin"
on public.votes for select
to authenticated
using (user_id = auth.uid() or public.is_admin());

create policy "verified_members_vote"
on public.votes for insert
to authenticated
with check (
  user_id = auth.uid()
  and exists (
    select 1 from public.profiles
    where id = auth.uid() and active
  )
  and exists (
    select 1 from public.polls
    where id = poll_id and active and (closes_at is null or closes_at > now())
  )
  and exists (
    select 1 from public.poll_options
    where id = option_id and poll_id = votes.poll_id
  )
);

create policy "applications_insert_own"
on public.r4_applications for insert
to authenticated
with check (
  user_id = auth.uid()
  and exists (
    select 1 from public.profiles
    where id = auth.uid() and active
  )
);

create policy "applications_read_own_or_admin"
on public.r4_applications for select
to authenticated
using (user_id = auth.uid() or public.is_admin());

create policy "applications_admin_update"
on public.r4_applications for update
to authenticated
using (public.is_admin())
with check (public.is_admin());

create or replace function public.poll_results(requested_poll uuid)
returns table (option_id uuid, vote_count bigint)
language sql
stable
security definer
set search_path = ''
as $$
  select options.id, count(votes.option_id)
  from public.poll_options options
  left join public.votes votes on votes.option_id = options.id
  where options.poll_id = requested_poll
  group by options.id, options.position
  order by options.position;
$$;

create or replace function public.create_poll(
  poll_question text,
  option_labels text[],
  poll_closes_at timestamptz default null
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  new_poll_id uuid;
begin
  if not public.is_admin() then
    raise exception 'Administrator access required';
  end if;

  if length(trim(poll_question)) < 5 or cardinality(option_labels) not between 2 and 12 then
    raise exception 'A poll needs a question and between 2 and 12 options';
  end if;

  insert into public.polls (question, closes_at, created_by)
  values (trim(poll_question), poll_closes_at, auth.uid())
  returning id into new_poll_id;

  insert into public.poll_options (poll_id, label, position)
  select new_poll_id, trim(option_label), option_position::smallint
  from unnest(option_labels) with ordinality as supplied(option_label, option_position)
  where length(trim(option_label)) > 0;

  if (select count(*) from public.poll_options where poll_id = new_poll_id) <> cardinality(option_labels) then
    raise exception 'Poll options cannot be empty';
  end if;

  return new_poll_id;
end;
$$;

revoke all on all tables in schema public from anon, authenticated;
revoke all on all sequences in schema public from anon, authenticated;
revoke all on all functions in schema public from public, anon, authenticated;

alter default privileges in schema public revoke all on tables from anon, authenticated;
alter default privileges in schema public revoke all on sequences from anon, authenticated;
alter default privileges in schema public revoke all on functions from public, anon, authenticated;

grant usage on schema public to anon, authenticated;
grant select on public.polls, public.poll_options to anon, authenticated;
grant select on public.profiles, public.votes, public.r4_applications to authenticated;
grant insert on public.votes, public.r4_applications to authenticated;
grant insert, update, delete on public.polls, public.poll_options to authenticated;
grant update on public.profiles to authenticated;
grant update on public.r4_applications to authenticated;
grant execute on function public.is_admin(uuid) to authenticated;
grant execute on function public.poll_results(uuid) to anon, authenticated;
grant execute on function public.create_poll(text, text[], timestamptz) to authenticated;
