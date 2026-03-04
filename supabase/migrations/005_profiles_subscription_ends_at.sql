-- When user cancels at period end: keep plan until this date (do not set plan to free immediately)
alter table public.profiles add column if not exists subscription_ends_at timestamptz;
