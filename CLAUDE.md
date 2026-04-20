# Levyl — Steering File

Re-read this file at the start of every session.

## What is Levyl?
A life goal tracker built like a game. Users progress through 4 Seasons (12 weeks each) per year, each containing Milestones broken into Weekly Goals. XP and badges reward consistency.

## Hierarchy
Vision (describe ideal year) → Goals (dynamic categories) → Milestones → Assign to Seasons (12 weeks each) → Weekly Goals

## Core Rules
- One active season at a time (no parallel seasons)
- Vision page is the starting point: describe your ideal year, AI extracts dynamic goals
- Each Goal has one or more Milestones; Milestones are assigned to specific Seasons
- Season end with unfinished milestones = forced resolution modal (complete or carry forward)
- Today view shows milestone-grouped weekly goals only for the active week
- Goals have dynamic categories (not tied to fixed Life Areas)

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
| /vision      | Vision    | 3-stage goal builder: write year → AI generate/manual add → expand & add milestones |

## Key Files
| File                              | Purpose                         |
|-----------------------------------|---------------------------------|
| src/types/index.ts                | All TypeScript interfaces        |
| src/lib/constants.ts              | LIFE_AREAS + SEASONS config      |
| src/lib/supabase.ts               | Supabase client                  |
| src/store/appStore.ts             | Zustand store (currently mock)   |
| src/components/layout/TopNav.tsx  | Global navigation                |
| src/pages/*.tsx                   | Page components                  |

## Vision Page (3-Stage Flow)

**Stage 1: Write your year**
- User describes their ideal year as if already accomplished (past tense journal)
- Label: "Describe your year as if it's already happened"
- Placeholder: "It's December 31st. You're looking back on this year..."
- Two action buttons:
  - "Generate my goals from this →" (calls Anthropic API with claude-sonnet-4-20250514)
  - "Add a goal manually" (toggles inline form)

**Stage 2: Goals**
- Shown after AI generation or manual add
- Each Goal card displays: title, dynamic category tag, milestone count
- Category colors auto-assigned from deterministic hash palette
- User can delete, expand, or add another goal

**Stage 3: Milestones (Inline)**
- Click Goal card to expand and view/manage its milestones
- Inline add milestone form at bottom of expanded goal
- Milestones assigned to Seasons in the Seasons page later

### Setup for AI Goal Generation

To enable the "Generate my goals from this →" feature:

1. Get an Anthropic API key from https://console.anthropic.com/account/keys
2. Create a `.env.local` file in the project root (if it doesn't exist)
3. Add: `VITE_ANTHROPIC_API_KEY=your_api_key_here`
4. Restart the dev server for changes to take effect

Without the API key set, clicking "Generate" will show an error message. Manual goal creation via "Add a goal manually" works without an API key.

## Coding Conventions
- All styling via inline styles + Tailwind utility classes (dark-first, no light mode)
- Colors from constants.ts, not hardcoded in components (except TopNav which is stable)
- No App.css — only src/index.css with @import "tailwindcss" and @theme block
- Zustand store actions: toggleGoalDone, addMilestone, updateVision, addGoal, addMilestoneToGoal, etc.
- Supabase not yet wired — store uses mock data; wire in when auth is added
- Anthropic API key: VITE_ANTHROPIC_API_KEY (env var, use fetch with x-api-key header)
