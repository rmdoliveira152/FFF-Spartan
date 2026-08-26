alter table public.board_news_comments
add column image_paths text[] not null default '{}';

alter table public.poll_comments
add column image_paths text[] not null default '{}';

alter table public.board_news_comments
add constraint board_news_comments_image_count_check
check (cardinality(image_paths) <= 5);

alter table public.poll_comments
add constraint poll_comments_image_count_check
check (cardinality(image_paths) <= 5);

alter table public.board_news_comments
drop constraint board_news_comments_content_check;

alter table public.poll_comments
drop constraint poll_comments_content_check;

alter table public.board_news_comments
add constraint board_news_comments_content_check
check (
  length(trim(content)) <= 500
  and (length(trim(content)) >= 1 or cardinality(image_paths) >= 1)
);

alter table public.poll_comments
add constraint poll_comments_content_check
check (
  length(trim(content)) <= 500
  and (length(trim(content)) >= 1 or cardinality(image_paths) >= 1)
);

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('discussion-images', 'discussion-images', false, 1048576, array['image/webp'])
on conflict (id) do update
set public = excluded.public,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

create policy "approved_members_upload_discussion_images"
on storage.objects for insert
to authenticated
with check (
  bucket_id = 'discussion-images'
  and public.is_approved_member()
  and (storage.foldername(name))[1] = auth.uid()::text
  and (storage.foldername(name))[2] in ('board_news', 'poll')
);

create policy "approved_members_read_discussion_images"
on storage.objects for select
to authenticated
using (
  bucket_id = 'discussion-images'
  and public.is_approved_member()
  and (
    exists (
      select 1 from public.board_news_comments
      where deleted_at is null and image_paths @> array[storage.objects.name]
    )
    or exists (
      select 1 from public.poll_comments
      where deleted_at is null and image_paths @> array[storage.objects.name]
    )
  )
);

create policy "authors_delete_discussion_images"
on storage.objects for delete
to authenticated
using (
  bucket_id = 'discussion-images'
  and public.is_approved_member()
  and ((storage.foldername(name))[1] = auth.uid()::text or public.is_admin())
);

drop function public.discussion_comments(text, uuid);

create function public.discussion_comments(
  resource_kind text,
  resource_id uuid
)
returns table (
  comment_id uuid,
  member_name text,
  message text,
  image_paths text[],
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
      select comments.id, comments.author_name, comments.content, comments.image_paths, comments.created_at,
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
      select comments.id, comments.author_name, comments.content, comments.image_paths, comments.created_at,
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

drop function public.post_discussion_comment(text, uuid, text);

create function public.post_discussion_comment(
  resource_kind text,
  resource_id uuid,
  message text,
  requested_image_paths text[] default '{}'
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
  safe_image_paths text[] := coalesce(requested_image_paths, '{}');
  expected_prefix text := auth.uid()::text || '/' || resource_kind || '/' || resource_id::text || '/';
begin
  if not public.is_approved_member() then
    raise exception 'Approved member access required';
  end if;

  if length(trim(coalesce(message, ''))) > 500
    or (length(trim(coalesce(message, ''))) = 0 and cardinality(safe_image_paths) = 0) then
    raise exception 'A comment must contain text or an image';
  end if;

  if cardinality(safe_image_paths) > 5 then
    raise exception 'A comment may contain at most five images';
  end if;

  if exists (
    select 1
    from unnest(safe_image_paths) as image_path
    where image_path not like expected_prefix || '%'
      or not exists (
        select 1 from storage.objects
        where bucket_id = 'discussion-images'
          and name = image_path
          and owner_id = auth.uid()::text
      )
  ) then
    raise exception 'Invalid discussion image';
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

    insert into public.board_news_comments (news_id, author_id, author_name, content, image_paths)
    values (resource_id, auth.uid(), current_member_name, trim(coalesce(message, '')), safe_image_paths)
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

    insert into public.poll_comments (poll_id, author_id, author_name, content, image_paths)
    values (resource_id, auth.uid(), current_member_name, trim(coalesce(message, '')), safe_image_paths)
    returning id into new_comment_id;
  else
    raise exception 'Unsupported discussion type';
  end if;

  return new_comment_id;
end;
$$;

revoke all on function public.discussion_comments(text, uuid) from public, anon, authenticated;
revoke all on function public.post_discussion_comment(text, uuid, text, text[]) from public, anon, authenticated;
grant execute on function public.discussion_comments(text, uuid) to authenticated;
grant execute on function public.post_discussion_comment(text, uuid, text, text[]) to authenticated;