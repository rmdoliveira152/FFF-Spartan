create table public.board_news_comments (
  id uuid primary key default gen_random_uuid(),
  news_id uuid not null references public.board_news(id) on delete cascade,
  author_id uuid references public.profiles(id) on delete set null,
  author_name text not null check (length(author_name) between 1 and 120),
  content text not null check (length(trim(content)) between 1 and 500),
  translations jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  deleted_at timestamptz,
  deleted_by uuid references public.profiles(id) on delete set null
);

create table public.poll_comments (
  id uuid primary key default gen_random_uuid(),
  poll_id uuid not null references public.polls(id) on delete cascade,
  author_id uuid references public.profiles(id) on delete set null,
  author_name text not null check (length(author_name) between 1 and 120),
  content text not null check (length(trim(content)) between 1 and 500),
  translations jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  deleted_at timestamptz,
  deleted_by uuid references public.profiles(id) on delete set null
);

create index board_news_comments_thread_idx
on public.board_news_comments (news_id, created_at desc)
where deleted_at is null;

create index poll_comments_thread_idx
on public.poll_comments (poll_id, created_at desc)
where deleted_at is null;

alter table public.board_news_comments enable row level security;
alter table public.poll_comments enable row level security;

create or replace function public.is_approved_member(check_user uuid default auth.uid())
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.profiles
    where id = check_user
      and active
      and (registration_status = 'approved' or role = 'admin')
  );
$$;

create policy "approved_members_read_news_comments"
on public.board_news_comments for select
to authenticated
using (
  public.is_approved_member()
  and deleted_at is null
  and exists (
    select 1
    from public.board_news
    where id = news_id
      and published
      and published_at <= now()
  )
);

create policy "approved_members_read_poll_comments"
on public.poll_comments for select
to authenticated
using (
  public.is_approved_member()
  and deleted_at is null
  and exists (
    select 1
    from public.polls
    where id = poll_id and active
  )
);

create or replace function public.discussion_comments(
  resource_kind text,
  resource_id uuid
)
returns table (
  comment_id uuid,
  member_name text,
  message text,
  created_at timestamptz,
  is_own boolean,
  can_delete boolean
)
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if not public.is_approved_member() then
    raise exception 'Approved member access required';
  end if;

  if resource_kind = 'board_news' then
    if not exists (
      select 1 from public.board_news
      where id = resource_id and published and published_at <= now()
    ) then
      raise exception 'Announcement discussion is unavailable';
    end if;

    return query
      select comments.id, comments.author_name, comments.content, comments.created_at,
        comments.author_id = auth.uid(),
        comments.author_id = auth.uid() or public.is_admin()
      from public.board_news_comments comments
      where comments.news_id = resource_id and comments.deleted_at is null
      order by comments.created_at asc;
  elsif resource_kind = 'poll' then
    if not exists (select 1 from public.polls where id = resource_id and active) then
      raise exception 'Poll discussion is unavailable';
    end if;

    return query
      select comments.id, comments.author_name, comments.content, comments.created_at,
        comments.author_id = auth.uid(),
        comments.author_id = auth.uid() or public.is_admin()
      from public.poll_comments comments
      where comments.poll_id = resource_id and comments.deleted_at is null
      order by comments.created_at asc;
  else
    raise exception 'Unsupported discussion type';
  end if;
end;
$$;

create or replace function public.post_discussion_comment(
  resource_kind text,
  resource_id uuid,
  message text
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  new_comment_id uuid;
  current_member_name text;
  recent_comments integer;
begin
  if not public.is_approved_member() then
    raise exception 'Approved member access required';
  end if;

  if length(trim(message)) not between 1 and 500 then
    raise exception 'A comment must contain between 1 and 500 characters';
  end if;

  select member_name into current_member_name
  from public.profiles
  where id = auth.uid();

  if resource_kind = 'board_news' then
    if not exists (
      select 1 from public.board_news
      where id = resource_id
        and published
        and published_at <= now()
        and archived_at is null
        and (expires_at is null or expires_at > now())
    ) then
      raise exception 'This announcement discussion is closed';
    end if;

    select count(*) into recent_comments
    from public.board_news_comments
    where news_id = resource_id
      and author_id = auth.uid()
      and created_at > now() - interval '5 minutes';

    if recent_comments >= 5 then
      raise exception 'Please wait before posting another comment';
    end if;

    insert into public.board_news_comments (news_id, author_id, author_name, content)
    values (resource_id, auth.uid(), current_member_name, trim(message))
    returning id into new_comment_id;
  elsif resource_kind = 'poll' then
    if not exists (
      select 1 from public.polls
      where id = resource_id
        and active
        and (closes_at is null or closes_at > now())
    ) then
      raise exception 'This poll discussion is closed';
    end if;

    select count(*) into recent_comments
    from public.poll_comments
    where poll_id = resource_id
      and author_id = auth.uid()
      and created_at > now() - interval '5 minutes';

    if recent_comments >= 5 then
      raise exception 'Please wait before posting another comment';
    end if;

    insert into public.poll_comments (poll_id, author_id, author_name, content)
    values (resource_id, auth.uid(), current_member_name, trim(message))
    returning id into new_comment_id;
  else
    raise exception 'Unsupported discussion type';
  end if;

  return new_comment_id;
end;
$$;

create or replace function public.delete_discussion_comment(
  resource_kind text,
  comment_id uuid
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  affected_rows integer;
begin
  if not public.is_approved_member() and not public.is_admin() then
    raise exception 'Approved member access required';
  end if;

  if resource_kind = 'board_news' then
    update public.board_news_comments
    set deleted_at = now(), deleted_by = auth.uid()
    where id = comment_id
      and deleted_at is null
      and (author_id = auth.uid() or public.is_admin());
  elsif resource_kind = 'poll' then
    update public.poll_comments
    set deleted_at = now(), deleted_by = auth.uid()
    where id = comment_id
      and deleted_at is null
      and (author_id = auth.uid() or public.is_admin());
  else
    raise exception 'Unsupported discussion type';
  end if;

  get diagnostics affected_rows = row_count;
  if affected_rows = 0 then
    raise exception 'Comment not found or deletion not allowed';
  end if;
end;
$$;

create or replace function public.store_discussion_translation(
  resource_kind text,
  comment_id uuid,
  target_language text,
  translation jsonb
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if length(target_language) not between 2 and 5
    or jsonb_typeof(translation) <> 'object'
    or not translation ? 'text'
    or not translation ? 'sourceLanguage' then
    raise exception 'Invalid translation cache entry';
  end if;

  if resource_kind = 'board_news' then
    update public.board_news_comments
    set translations = translations || jsonb_build_object(target_language, translation)
    where id = comment_id and deleted_at is null;
  elsif resource_kind = 'poll' then
    update public.poll_comments
    set translations = translations || jsonb_build_object(target_language, translation)
    where id = comment_id and deleted_at is null;
  else
    raise exception 'Unsupported discussion type';
  end if;
end;
$$;

revoke all on public.board_news_comments, public.poll_comments from anon, authenticated;
revoke all on function public.is_approved_member(uuid) from public, anon, authenticated;
revoke all on function public.discussion_comments(text, uuid) from public, anon, authenticated;
revoke all on function public.post_discussion_comment(text, uuid, text) from public, anon, authenticated;
revoke all on function public.delete_discussion_comment(text, uuid) from public, anon, authenticated;
revoke all on function public.store_discussion_translation(text, uuid, text, jsonb) from public, anon, authenticated;

grant select on public.board_news_comments, public.poll_comments to authenticated;
grant execute on function public.is_approved_member(uuid) to authenticated;
grant execute on function public.discussion_comments(text, uuid) to authenticated;
grant execute on function public.post_discussion_comment(text, uuid, text) to authenticated;
grant execute on function public.delete_discussion_comment(text, uuid) to authenticated;
grant execute on function public.store_discussion_translation(text, uuid, text, jsonb) to service_role;

do $$
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    alter publication supabase_realtime add table public.board_news_comments;
    alter publication supabase_realtime add table public.poll_comments;
  end if;
end;
$$;