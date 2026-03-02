-- Store Whop membership id for cancel-subscription (cancel via Whop API)
alter table public.profiles add column if not exists whop_membership_id text;
