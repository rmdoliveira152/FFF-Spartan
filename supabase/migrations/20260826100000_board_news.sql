create table public.board_news (
  id uuid primary key default gen_random_uuid(),
  translations jsonb not null check (jsonb_typeof(translations) = 'object'),
  default_language text not null check (default_language in ('pt', 'en', 'es', 'fr', 'de', 'it', 'pl', 'ru', 'tr', 'id', 'vi', 'th', 'ja', 'ko', 'ar', 'zh-CN', 'zh-TW')),
  priority text not null default 'standard' check (priority in ('standard', 'important', 'critical')),
  published boolean not null default false,
  published_at timestamptz not null default now(),
  expires_at timestamptz,
  archived_at timestamptz,
  created_by uuid not null references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (expires_at is null or expires_at > published_at),
  check (
    translations ? default_language
    and jsonb_typeof(translations -> default_language) = 'object'
    and coalesce(length(trim(translations -> default_language ->> 'title')), 0) between 3 and 120
    and coalesce(length(trim(translations -> default_language ->> 'body')), 0) between 3 and 2000
  )
);

create index board_news_publication_idx
on public.board_news (published, published_at desc);

create or replace function public.set_board_news_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger board_news_set_updated_at
before update on public.board_news
for each row execute procedure public.set_board_news_updated_at();

create or replace function public.protect_board_news_history()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if tg_op = 'DELETE' and old.published then
    raise exception 'Published announcements must remain in history';
  end if;
  if tg_op = 'UPDATE' and old.published and not new.published then
    raise exception 'Published announcements cannot return to draft';
  end if;
  return case when tg_op = 'DELETE' then old else new end;
end;
$$;

create trigger board_news_protect_history
before update or delete on public.board_news
for each row execute procedure public.protect_board_news_history();

alter table public.board_news enable row level security;

create policy "board_news_public_read"
on public.board_news for select
to anon, authenticated
using (published and published_at <= now());

create policy "board_news_admin_read"
on public.board_news for select
to authenticated
using (public.is_admin());

create policy "board_news_admin_insert"
on public.board_news for insert
to authenticated
with check (public.is_admin() and created_by = auth.uid());

create policy "board_news_admin_update"
on public.board_news for update
to authenticated
using (public.is_admin())
with check (public.is_admin());

create policy "board_news_admin_delete_drafts"
on public.board_news for delete
to authenticated
using (public.is_admin() and not published);

grant select on public.board_news to anon, authenticated;
grant insert, update, delete on public.board_news to authenticated;
revoke all on function public.set_board_news_updated_at() from public, anon, authenticated;
revoke all on function public.protect_board_news_history() from public, anon, authenticated;