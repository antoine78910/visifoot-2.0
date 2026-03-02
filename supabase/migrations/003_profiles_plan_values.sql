-- Allow plan values: free, starter, pro, lifetime (was free, premium)
alter table public.profiles drop constraint if exists profiles_plan_check;
alter table public.profiles add constraint profiles_plan_check check (plan in ('free', 'starter', 'pro', 'lifetime', 'premium'));
