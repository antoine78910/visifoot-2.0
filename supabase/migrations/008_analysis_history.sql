-- Historique des analyses par utilisateur (persistant, survivant aux déploiements et changements d'appareil)
create table if not exists public.analysis_history (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  home_team text not null,
  away_team text not null,
  home_logo text,
  away_logo text,
  league text,
  result jsonb not null,
  created_at timestamptz not null default now()
);
create index if not exists idx_analysis_history_user_created on public.analysis_history(user_id, created_at desc);

alter table public.analysis_history enable row level security;

create policy "Users can read own analysis history"
  on public.analysis_history for select
  using (auth.uid() = user_id);

create policy "Users can insert own analysis history"
  on public.analysis_history for insert
  with check (auth.uid() = user_id);

create policy "Users can delete own analysis history"
  on public.analysis_history for delete
  using (auth.uid() = user_id);
