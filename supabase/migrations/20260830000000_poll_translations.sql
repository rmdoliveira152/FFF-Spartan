create table public.poll_translation_cache (
  poll_id uuid not null references public.polls(id) on delete cascade,
  target_language text not null check (target_language in ('pt', 'en', 'es', 'fr', 'de', 'it', 'pl', 'ru', 'tr', 'id', 'vi', 'th', 'ja', 'ko', 'ar', 'zh-CN', 'zh-TW')),
  detected_source_language text not null,
  question text not null,
  options jsonb not null check (jsonb_typeof(options) = 'object'),
  source_hash text not null,
  created_at timestamptz not null default now(),
  primary key (poll_id, target_language)
);

alter table public.poll_translation_cache enable row level security;

revoke all on public.poll_translation_cache from public, anon, authenticated;
