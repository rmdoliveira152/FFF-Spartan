alter table public.profiles
  add column if not exists notify_poll_emails boolean not null default true,
  add column if not exists notify_news_emails boolean not null default true;

create table if not exists public.notification_deliveries (
  id uuid primary key default gen_random_uuid(),
  kind text not null check (kind in ('poll', 'board_news')),
  resource_id uuid not null,
  recipient_user_id uuid not null references public.profiles(id) on delete cascade,
  status text not null default 'pending' check (status in ('pending', 'sent', 'failed')),
  email_id text,
  error text,
  created_at timestamptz not null default now(),
  sent_at timestamptz,
  unique (kind, resource_id, recipient_user_id)
);

alter table public.notification_deliveries enable row level security;

drop policy if exists "notification_deliveries_admin_read" on public.notification_deliveries;
create policy "notification_deliveries_admin_read"
on public.notification_deliveries for select
to authenticated
using (public.is_admin());

grant select on public.notification_deliveries to authenticated;

create or replace function public.update_email_preferences(
  poll_emails boolean,
  news_emails boolean
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if auth.uid() is null then raise exception 'Authentication required'; end if;

  update public.profiles
  set notify_poll_emails = poll_emails,
      notify_news_emails = news_emails
  where id = auth.uid();
end;
$$;

revoke all on function public.update_email_preferences(boolean, boolean) from public, anon, authenticated;
grant execute on function public.update_email_preferences(boolean, boolean) to authenticated;