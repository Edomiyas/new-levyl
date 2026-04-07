# Levyl

> A life goal tracker built like a game.

## Overview

Levyl turns your annual life goals into a structured 4-season game. Each year has 4 Seasons of 12 weeks each. Within each season you set Milestones (big goals), broken into Weekly Goals with clear success criteria. Complete goals, earn XP, level up.

## Goal Hierarchy

```
Vision Statement
└── 6 Life Areas (Physical, Mind, Spiritual, Wealth, Community, Family)
    └── 4 Seasons (Spring → Summer → Fall → Winter, 12 weeks each)
        └── Milestones (big goals per season)
            └── Weekly Goals (what you do each week to hit the milestone)
```

## Core Rules

1. **One active season at a time** — seasons are sequential, no overlap
2. **Goals added from Vision** — the Add Milestone button lives on the Vision page and locks to the current season
3. **Season resolution** — when a season ends, unfinished milestones must be resolved (mark done or carry forward)
4. **Today = focus mode** — the Today view shows only this week's goals, grouped by milestone

## Pages

| Route | Description |
|-------|-------------|
| `/dashboard` | Life overview with XP, level, life-balance rings, active milestones, season sidebar, badges |
| `/today` | Mood check-in, week progress strip, milestone-grouped checklist of this week's goals |
| `/seasons` | Season tabs, milestone list, per-milestone detail with 12-week strip |
| `/vision` | Vision statement editor, add-milestone modal, year arc cards, annual life-area progress |

## Tech Stack

- **React 18 + TypeScript** — component framework
- **Vite** — build tool
- **Tailwind CSS v4** — utility styling via `@tailwindcss/vite`
- **Zustand** — client state management
- **Supabase** — auth + PostgreSQL database (env vars below)
- **React Router v6** — client-side routing
- **Lucide React** — icons
- **Nunito** — Google Fonts typeface (400/600/700/800/900)

## Getting Started

```bash
# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Fill in VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY

# Start dev server
npm run dev
```

## Environment Variables

```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## Color System

| Token | Value |
|-------|-------|
| Background | `#0F0F0F` |
| Surface | `#181818` |
| Surface2 | `#202020` |
| Border | `rgba(255,255,255,0.07)` |
| Text | `#F0EFEB` |
| Muted | `rgba(255,255,255,0.36)` |
| Accent | `#AADF4F` |

**Life area colors:** Physical `#5DCAA5` · Mind `#A89EF5` · Spiritual `#F5C542` · Wealth `#AADF4F` · Community `#5BA8F5` · Family `#F0739A`

**Season colors:** Spring `#AADF4F` · Summer `#5DCAA5` · Fall `#F5C542` · Winter `#A89EF5`

## Project Structure

```
src/
├── types/index.ts          # TypeScript interfaces
├── lib/
│   ├── constants.ts        # LIFE_AREAS + SEASONS config
│   └── supabase.ts         # Supabase client
├── store/appStore.ts       # Zustand store
├── components/
│   └── layout/TopNav.tsx   # Top navigation
└── pages/
    ├── Dashboard.tsx
    ├── Today.tsx
    ├── Seasons.tsx
    └── Vision.tsx
```
