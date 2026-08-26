alter table public.board_news
add column if not exists image_paths text[] not null default '{}'
check (cardinality(image_paths) <= 4);

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'board-news',
  'board-news',
  true,
  5242880,
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update
set public = excluded.public,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "board_news_images_admin_insert" on storage.objects;
create policy "board_news_images_admin_insert"
on storage.objects for insert
to authenticated
with check (bucket_id = 'board-news' and public.is_admin());

drop policy if exists "board_news_images_admin_delete" on storage.objects;
create policy "board_news_images_admin_delete"
on storage.objects for delete
to authenticated
using (bucket_id = 'board-news' and public.is_admin());