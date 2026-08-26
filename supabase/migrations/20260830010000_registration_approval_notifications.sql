alter table public.notification_deliveries
  drop constraint if exists notification_deliveries_kind_check;

alter table public.notification_deliveries
  add constraint notification_deliveries_kind_check
  check (kind in ('poll', 'board_news', 'registration_approved'));