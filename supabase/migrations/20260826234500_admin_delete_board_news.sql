create or replace function public.protect_board_news_history()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if tg_op = 'DELETE' and old.archived_at is null then
    raise exception 'Only archived announcements can be deleted';
  end if;
  if tg_op = 'UPDATE' and old.published and not new.published then
    raise exception 'Published announcements cannot return to draft';
  end if;
  return case when tg_op = 'DELETE' then old else new end;
end;
$$;

drop policy if exists "board_news_admin_delete_drafts" on public.board_news;

create policy "board_news_admin_delete"
on public.board_news for delete
to authenticated
using (public.is_admin() and archived_at is not null);