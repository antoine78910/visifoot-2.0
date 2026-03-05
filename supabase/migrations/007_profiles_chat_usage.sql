-- Chat IA usage: Pro = 1 request/day, Lifetime = unlimited
alter table public.profiles
  add column if not exists chat_requests_used_today int default 0;
alter table public.profiles
  add column if not exists last_chat_date date;
