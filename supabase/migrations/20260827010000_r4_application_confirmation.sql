alter table public.r4_applications
  add column if not exists code_agreed_at timestamptz,
  add column if not exists code_version text,
  add column if not exists confirmation_email_status text not null default 'not_requested',
  add column if not exists confirmation_email_id text,
  add column if not exists confirmation_email_sent_at timestamptz;

alter table public.r4_applications
  drop constraint if exists r4_applications_confirmation_email_status_check;

alter table public.r4_applications
  add constraint r4_applications_confirmation_email_status_check
  check (confirmation_email_status in ('not_requested', 'pending', 'sent', 'failed'));

drop policy if exists "applications_insert_own" on public.r4_applications;
revoke insert on public.r4_applications from authenticated;