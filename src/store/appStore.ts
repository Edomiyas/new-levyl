import { create } from 'zustand'
import type { User, Season, Badge, Milestone, WeeklyGoal, Goal } from '../types'

interface AppState {
  user: User
  seasons: Season[]
  badges: Badge[]
  toggleGoalDone: (goalId: string) => void
  addMilestone: (milestone: Milestone) => void
  addWeeklyGoal: (milestoneId: string, goal: WeeklyGoal) => void
  updateVision: (statement: string) => void
  addGoal: (goal: Goal) => void
  updateGoal: (goalId: string, updates: Partial<Goal>) => void
  deleteGoal: (goalId: string) => void
  addMilestoneToGoal: (goalId: string, milestone: Milestone) => void
  deleteMilestoneFromGoal: (goalId: string, milestoneId: string) => void
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
    status: 'overdue',
    weeksDone: 3,
    currentWeek: 4,
    milestones: [
      {
        id: 'ms-3',
        seasonKey: 'summer',
        lifeAreaKey: 'physical',
        title: 'Hit 3x gym per week',
        status: 'done',
        statusNote: 'Completed week 2',
        weeklyGoals: mockWeeklyGoals('ms-3'),
      },
      {
        id: 'ms-4',
        seasonKey: 'summer',
        lifeAreaKey: 'wealth',
        title: 'Invest $500 into index fund monthly',
        status: 'active',
        statusNote: 'In progress – 2 months left',
        weeklyGoals: mockWeeklyGoals('ms-4'),
      },
      {
        id: 'ms-5',
        seasonKey: 'summer',
        lifeAreaKey: 'mind',
        title: 'Read 2 books on mental models',
        status: 'not_started',
        statusNote: 'Not started',
        weeklyGoals: [],
      },
      {
        id: 'ms-6',
        seasonKey: 'summer',
        lifeAreaKey: 'community',
        title: 'Attend 2 community events',
        status: 'active',
        statusNote: 'Flagged at risk',
        atRisk: true,
        weeklyGoals: mockWeeklyGoals('ms-6'),
      },
      {
        id: 'ms-7',
        seasonKey: 'summer',
        lifeAreaKey: 'spiritual',
        title: 'Daily 10-min morning practice',
        status: 'active',
        statusNote: '40% consistency so far',
        weeklyGoals: mockWeeklyGoals('ms-7'),
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
  { id: 'b1', icon: '🏋️', label: 'First lift', earned: true },
  { id: 'b2', icon: '🧠', label: 'Mind seed', earned: true },
  { id: 'b3', icon: '💰', label: 'First invest', earned: true },
  { id: 'b4', icon: '⭐', label: '10 wk streak', earned: false },
  { id: 'b5', icon: '🌸', label: 'Full bloom', earned: false },
  { id: 'b6', icon: '🏆', label: 'Season done', earned: false },
]

export const useAppStore = create<AppState>((set) => ({
  user: {
    id: 'user-1',
    name: 'Arsenic',
    currentSeason: 'summer',
    xp: 1240,
    level: 4,
    streak: 12,
    visionStatement:
      'I am building a life of intentional growth — physically strong, mentally sharp, spiritually grounded, and financially free — while showing up fully for my family and community.',
    goals: [],
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

  addWeeklyGoal: (milestoneId, goal) =>
    set((state) => ({
      seasons: state.seasons.map((season) => ({
        ...season,
        milestones: season.milestones.map((ms) =>
          ms.id === milestoneId
            ? { ...ms, weeklyGoals: [...ms.weeklyGoals, goal] }
            : ms
        ),
      })),
    })),

  updateVision: (statement) =>
    set((state) => ({
      user: { ...state.user, visionStatement: statement },
    })),

  addGoal: (goal) =>
    set((state) => ({
      user: { ...state.user, goals: [...state.user.goals, goal] },
    })),

  updateGoal: (goalId, updates) =>
    set((state) => ({
      user: {
        ...state.user,
        goals: state.user.goals.map((g) =>
          g.id === goalId ? { ...g, ...updates } : g
        ),
      },
    })),

  deleteGoal: (goalId) =>
    set((state) => ({
      user: {
        ...state.user,
        goals: state.user.goals.filter((g) => g.id !== goalId),
      },
    })),

  addMilestoneToGoal: (goalId, milestone) =>
    set((state) => ({
      user: {
        ...state.user,
        goals: state.user.goals.map((g) =>
          g.id === goalId
            ? { ...g, milestones: [...g.milestones, milestone] }
            : g
        ),
      },
    })),

  deleteMilestoneFromGoal: (goalId, milestoneId) =>
    set((state) => ({
      user: {
        ...state.user,
        goals: state.user.goals.map((g) =>
          g.id === goalId
            ? { ...g, milestones: g.milestones.filter((m) => m.id !== milestoneId) }
            : g
        ),
      },
    })),
}))
