-- Admin dashboard + feedback + richer usage tracking

alter table public.profiles
  add column if not exists analyses_total int default 0;

create table if not exists public.analysis_feedback (
  id bigint generated always as identity primary key,
  created_at timestamptz not null default now(),
  user_id text,
  home_team text,
  away_team text,
  page text default 'analysis',
  email text,
  message text not null
);
create index if not exists idx_analysis_feedback_created_at on public.analysis_feedback(created_at desc);
create index if not exists idx_analysis_feedback_user on public.analysis_feedback(user_id, created_at desc);

create table if not exists public.analysis_events (
  id bigint generated always as identity primary key,
  created_at timestamptz not null default now(),
  user_id text not null,
  home_team text,
  away_team text,
  source text default 'predict'
);
create index if not exists idx_analysis_events_created_at on public.analysis_events(created_at desc);
create index if not exists idx_analysis_events_user on public.analysis_events(user_id, created_at desc);
create index if not exists idx_analysis_events_match on public.analysis_events(home_team, away_team, created_at desc);
