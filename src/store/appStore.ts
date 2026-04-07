import { create } from 'zustand'
import type { User, Season, Badge, Milestone, WeeklyGoal } from '../types'

interface AppState {
  user: User
  seasons: Season[]
  badges: Badge[]
  toggleGoalDone: (goalId: string) => void
  addMilestone: (milestone: Milestone) => void
  updateVision: (statement: string) => void
}

const mockWeeklyGoals = (milestoneId: string): WeeklyGoal[] => [
  {
    id: `${milestoneId}-g1`,
    milestoneId,
    weekNumber: 1,
    title: 'Research and plan approach',
    successCriteria: 'Have a clear written plan',
    done: true,
  },
  {
    id: `${milestoneId}-g2`,
    milestoneId,
    weekNumber: 2,
    title: 'Execute first phase',
    successCriteria: 'First phase complete with notes',
    done: false,
  },
  {
    id: `${milestoneId}-g3`,
    milestoneId,
    weekNumber: 3,
    title: 'Review and iterate',
    successCriteria: 'Reviewed with adjustments documented',
    done: false,
  },
]

const initialSeasons: Season[] = [
  {
    key: 'spring',
    status: 'done',
    weeksDone: 12,
    currentWeek: null,
    milestones: [
      {
        id: 'ms-1',
        seasonKey: 'spring',
        lifeAreaKey: 'physical',
        title: 'Run a 5K under 30 minutes',
        status: 'done',
        weeklyGoals: mockWeeklyGoals('ms-1'),
      },
      {
        id: 'ms-2',
        seasonKey: 'spring',
        lifeAreaKey: 'wealth',
        title: 'Build 3-month emergency fund',
        status: 'done',
        weeklyGoals: mockWeeklyGoals('ms-2'),
      },
    ],
  },
  {
    key: 'summer',
    status: 'current',
    weeksDone: 6,
    currentWeek: 7,
    milestones: [
      {
        id: 'ms-3',
        seasonKey: 'summer',
        lifeAreaKey: 'mind',
        title: 'Read 4 books on philosophy',
        status: 'active',
        weeklyGoals: mockWeeklyGoals('ms-3'),
      },
      {
        id: 'ms-4',
        seasonKey: 'summer',
        lifeAreaKey: 'physical',
        title: 'Establish daily meditation habit',
        status: 'active',
        weeklyGoals: mockWeeklyGoals('ms-4'),
      },
      {
        id: 'ms-5',
        seasonKey: 'summer',
        lifeAreaKey: 'wealth',
        title: 'Launch side project MVP',
        status: 'active',
        weeklyGoals: mockWeeklyGoals('ms-5'),
      },
      {
        id: 'ms-6',
        seasonKey: 'summer',
        lifeAreaKey: 'community',
        title: 'Volunteer 20 hours locally',
        status: 'not_started',
        weeklyGoals: mockWeeklyGoals('ms-6'),
      },
    ],
  },
  {
    key: 'fall',
    status: 'upcoming',
    weeksDone: 0,
    currentWeek: null,
    milestones: [
      {
        id: 'ms-7',
        seasonKey: 'fall',
        lifeAreaKey: 'family',
        title: 'Plan and take family trip',
        status: 'not_started',
        weeklyGoals: [],
      },
      {
        id: 'ms-8',
        seasonKey: 'fall',
        lifeAreaKey: 'spiritual',
        title: 'Develop consistent prayer practice',
        status: 'not_started',
        weeklyGoals: [],
      },
    ],
  },
  {
    key: 'winter',
    status: 'upcoming',
    weeksDone: 0,
    currentWeek: null,
    milestones: [],
  },
]

const initialBadges: Badge[] = [
  { id: 'b1', icon: '🔥', label: 'First Flame', earned: true },
  { id: 'b2', icon: '🌱', label: 'Season Starter', earned: true },
  { id: 'b3', icon: '💎', label: 'Diamond Focus', earned: true },
  { id: 'b4', icon: '⚡', label: 'Week Warrior', earned: false },
  { id: 'b5', icon: '🏆', label: 'Season Champion', earned: false },
  { id: 'b6', icon: '🌟', label: 'All Areas Active', earned: false },
]

export const useAppStore = create<AppState>((set) => ({
  user: {
    id: 'user-1',
    name: 'Alex',
    currentSeason: 'summer',
    xp: 2450,
    level: 12,
    streak: 14,
    visionStatement:
      'I am building a life of intentional growth — physically strong, mentally sharp, spiritually grounded, and financially free — while showing up fully for my family and community.',
  },
  seasons: initialSeasons,
  badges: initialBadges,

  toggleGoalDone: (goalId) =>
    set((state) => ({
      seasons: state.seasons.map((season) => ({
        ...season,
        milestones: season.milestones.map((ms) => ({
          ...ms,
          weeklyGoals: ms.weeklyGoals.map((g) =>
            g.id === goalId ? { ...g, done: !g.done } : g
          ),
        })),
      })),
    })),

  addMilestone: (milestone) =>
    set((state) => ({
      seasons: state.seasons.map((season) =>
        season.key === milestone.seasonKey
          ? { ...season, milestones: [...season.milestones, milestone] }
          : season
      ),
    })),

  updateVision: (statement) =>
    set((state) => ({
      user: { ...state.user, visionStatement: statement },
    })),
}))
