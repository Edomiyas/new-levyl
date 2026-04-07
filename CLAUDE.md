# Levyl — Steering File

Re-read this file at the start of every session.

## What is Levyl?
A life goal tracker built like a game. Users progress through 4 Seasons (12 weeks each) per year, each containing Milestones broken into Weekly Goals. XP and badges reward consistency.

## Hierarchy
Vision → 6 Life Areas → 4 Seasons (12 weeks each) → Milestones → Weekly Goals

## Core Rules
- One active season at a time (no parallel seasons)
- Goals (Milestones) can only be added from the Vision page, always locked to the current season
- Season end with unfinished milestones = forced resolution modal (complete or carry forward)
- Today view shows milestone-grouped weekly goals only for the active week

## Stack
- React 18 + TypeScript + Vite
- Tailwind CSS v4 (via @tailwindcss/vite plugin — no tailwind.config.js)
- Supabase (auth + database) via VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY env vars
- Zustand for client state
- React Router v6 (BrowserRouter)
- Lucide React for icons
- Font: Nunito (Google Fonts) weights 400/600/700/800/900

## Color System
```
Background:  #0F0F0F
Surface:     #181818
Surface2:    #202020
Border:      rgba(255,255,255,0.07)
Text:        #F0EFEB
Muted:       rgba(255,255,255,0.36)
Accent:      #AADF4F

Life Areas:
  physical:  #5DCAA5  bg: rgba(93,202,165,0.10)
  mind:      #A89EF5  bg: rgba(168,158,245,0.10)
  spiritual: #F5C542  bg: rgba(245,197,66,0.10)
  wealth:    #AADF4F  bg: rgba(170,223,79,0.10)
  community: #5BA8F5  bg: rgba(91,168,245,0.10)
  family:    #F0739A  bg: rgba(240,115,154,0.10)

Seasons:
  spring: #AADF4F
  summer: #5DCAA5
  fall:   #F5C542
  winter: #A89EF5
```

## Routes
| Path         | Page      | Purpose                                              |
|--------------|-----------|------------------------------------------------------|
| /dashboard   | Dashboard | Life overview: rings, XP, stats, season sidebar      |
| /today       | Today     | Mood + week progress + milestone-grouped weekly goals|
| /seasons     | Seasons   | Season tabs + milestone list + detail panel          |
| /vision      | Vision    | Vision statement + add milestone modal + year arc    |

## Key Files
| File                              | Purpose                         |
|-----------------------------------|---------------------------------|
| src/types/index.ts                | All TypeScript interfaces        |
| src/lib/constants.ts              | LIFE_AREAS + SEASONS config      |
| src/lib/supabase.ts               | Supabase client                  |
| src/store/appStore.ts             | Zustand store (currently mock)   |
| src/components/layout/TopNav.tsx  | Global navigation                |
| src/pages/*.tsx                   | Page components                  |

## Coding Conventions
- All styling via inline styles + Tailwind utility classes (dark-first, no light mode)
- Colors from constants.ts, not hardcoded in components (except TopNav which is stable)
- No App.css — only src/index.css with @import "tailwindcss" and @theme block
- Zustand store actions: toggleGoalDone, addMilestone, updateVision
- Supabase not yet wired — store uses mock data; wire in when auth is added
