-- Levyl — initial schema
-- Run this in your Supabase SQL editor

-- Enable UUID extension
create extension if not exists "pgcrypto";

-- ─── profiles ─────────────────────────────────────────────────────────────────
-- One row per authenticated user. Extends auth.users via RLS.
create table if not exists public.profiles (
  id             uuid primary key references auth.users(id) on delete cascade,
  name           text not null default 'Player',
  current_season text not null default 'spring'
                   check (current_season in ('spring','summer','fall','winter')),
  xp             integer not null default 0,
  level          integer not null default 1,
  streak         integer not null default 0,
  vision_statement text not null default '',
  updated_at     timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "Users can view own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id);

-- Auto-create profile row when a new user signs up
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into public.profiles (id, name)
  values (new.id, coalesce(new.raw_user_meta_data->>'name', 'Player'));
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ─── seasons ──────────────────────────────────────────────────────────────────
-- One row per season per user (4 rows total per user).
create table if not exists public.seasons (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references public.profiles(id) on delete cascade,
  key          text not null check (key in ('spring','summer','fall','winter')),
  status       text not null default 'upcoming'
                 check (status in ('done','current','upcoming','overdue')),
  weeks_done   integer not null default 0 check (weeks_done between 0 and 12),
  current_week integer check (current_week between 1 and 12),
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  unique (user_id, key)
);

alter table public.seasons enable row level security;

create policy "Users can manage own seasons"
  on public.seasons for all
  using (auth.uid() = user_id);

-- ─── milestones ───────────────────────────────────────────────────────────────
create table if not exists public.milestones (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references public.profiles(id) on delete cascade,
  season_key    text not null check (season_key in ('spring','summer','fall','winter')),
  life_area_key text not null check (life_area_key in ('physical','mind','spiritual','wealth','community','family')),
  title         text not null,
  status        text not null default 'not_started'
                  check (status in ('not_started','active','done')),
  carried_over  boolean not null default false,
  sort_order    integer not null default 0,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

alter table public.milestones enable row level security;

create policy "Users can manage own milestones"
  on public.milestones for all
  using (auth.uid() = user_id);

create index on public.milestones (user_id, season_key);

-- ─── weekly_goals ─────────────────────────────────────────────────────────────
create table if not exists public.weekly_goals (
  id               uuid primary key default gen_random_uuid(),
  user_id          uuid not null references public.profiles(id) on delete cascade,
  milestone_id     uuid not null references public.milestones(id) on delete cascade,
  week_number      integer not null check (week_number between 1 and 12),
  title            text not null,
  success_criteria text not null default '',
  done             boolean not null default false,
  done_at          timestamptz,
  sort_order       integer not null default 0,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

alter table public.weekly_goals enable row level security;

create policy "Users can manage own weekly goals"
  on public.weekly_goals for all
  using (auth.uid() = user_id);

create index on public.weekly_goals (milestone_id);
create index on public.weekly_goals (user_id, week_number);

-- ─── badges ───────────────────────────────────────────────────────────────────
-- Static badge catalog (seeded once)
create table if not exists public.badges (
  id    text primary key,
  icon  text not null,
  label text not null,
  description text not null default ''
);

insert into public.badges (id, icon, label, description) values
  ('first_flame',      '🔥', 'First Flame',      'Complete your very first goal'),
  ('season_starter',   '🌱', 'Season Starter',    'Start your first season'),
  ('diamond_focus',    '💎', 'Diamond Focus',     'Complete all goals in a week'),
  ('week_warrior',     '⚡', 'Week Warrior',      'Complete 5 weeks in a row'),
  ('season_champion',  '🏆', 'Season Champion',   'Complete a full season'),
  ('all_areas_active', '🌟', 'All Areas Active',  'Have an active milestone in every life area')
on conflict (id) do nothing;

-- ─── user_badges ──────────────────────────────────────────────────────────────
-- Which badges each user has earned
create table if not exists public.user_badges (
  user_id    uuid not null references public.profiles(id) on delete cascade,
  badge_id   text not null references public.badges(id) on delete cascade,
  earned_at  timestamptz not null default now(),
  primary key (user_id, badge_id)
);

alter table public.user_badges enable row level security;

create policy "Users can view own badges"
  on public.user_badges for select
  using (auth.uid() = user_id);

create policy "Service role can award badges"
  on public.user_badges for insert
  with check (auth.uid() = user_id);

-- ─── updated_at trigger ───────────────────────────────────────────────────────
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger set_updated_at before update on public.profiles
  for each row execute procedure public.set_updated_at();

create trigger set_updated_at before update on public.seasons
  for each row execute procedure public.set_updated_at();

create trigger set_updated_at before update on public.milestones
  for each row execute procedure public.set_updated_at();

create trigger set_updated_at before update on public.weekly_goals
  for each row execute procedure public.set_updated_at();
