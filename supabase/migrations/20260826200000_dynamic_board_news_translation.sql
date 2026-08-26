alter table public.board_news
  drop constraint if exists board_news_default_language_check;

alter table public.board_news
  add constraint board_news_default_language_check
  check (default_language in ('und', 'pt', 'en', 'es', 'fr', 'de', 'it', 'pl', 'ru', 'tr', 'id', 'vi', 'th', 'ja', 'ko', 'ar', 'zh-CN', 'zh-TW'));

create table public.board_news_translation_cache (
  news_id uuid not null references public.board_news(id) on delete cascade,
  target_language text not null check (target_language in ('pt', 'en', 'es', 'fr', 'de', 'it', 'pl', 'ru', 'tr', 'id', 'vi', 'th', 'ja', 'ko', 'ar', 'zh-CN', 'zh-TW')),
  detected_source_language text,
  title text not null,
  body text not null,
  source_updated_at timestamptz not null,
  created_at timestamptz not null default now(),
  primary key (news_id, target_language)
);

alter table public.board_news_translation_cache enable row level security;
revoke all on public.board_news_translation_cache from public, anon, authenticated;

create or replace function public.clear_board_news_translation_cache()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if old.translations is distinct from new.translations
    or old.default_language is distinct from new.default_language then
    delete from public.board_news_translation_cache where news_id = new.id;
  end if;
  return new;
end;
$$;

create trigger board_news_clear_translation_cache
after update on public.board_news
for each row execute procedure public.clear_board_news_translation_cache();

revoke all on function public.clear_board_news_translation_cache() from public, anon, authenticated;
