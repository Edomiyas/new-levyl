import { create } from 'zustand'
import { getCategoryColor } from '../lib/constants'
import type {
  Badge,
  Goal,
  GoalMilestone,
  Milestone,
  Season,
  SeasonKey,
  User,
  WeeklyGoal,
} from '../types'

interface AppState {
  user: User
  yearDescription: string
  goals: Goal[]
  seasons: Season[]
  badges: Badge[]
  toggleGoalDone: (goalId: string) => void
  addMilestone: (milestone: Milestone) => void
  addWeeklyGoal: (milestoneId: string, goal: WeeklyGoal) => void
  setYearDescription: (text: string) => void
  addGoal: (goal: Goal) => void
  removeGoal: (id: string) => void
  updateGoal: (id: string, updates: Partial<Goal>) => void
  toggleGoalExpanded: (id: string) => void
  addGoalMilestone: (goalId: string, milestone: GoalMilestone) => void
  removeGoalMilestone: (goalId: string, milestoneId: string) => void
  updateGoalMilestone: (goalId: string, milestoneId: string, title: string) => void
  assignMilestoneToSeason: (
    goalId: string,
    milestoneId: string,
    seasonKey: SeasonKey
  ) => void
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

const initialYearDescription =
  "It’s December 31st, and I’m proud of how grounded this year felt. I rebuilt my strength and finally made the gym a steady part of life. I shipped the first real version of Levyl, got it into people’s hands, and learned from honest feedback instead of hiding in planning mode. I built healthier money habits, protected time for my family, and followed through on the trip we kept putting off. More than anything, I became someone who finished what mattered."

const initialGoals: Goal[] = [
  {
    id: 'goal-health',
    title: 'Rebuilt my strength and consistency in the gym',
    category: 'Health',
    categoryColor: getCategoryColor('Health'),
    seasonKey: 'spring',
    milestones: [
      {
        id: 'goal-health-ms-1',
        goalId: 'goal-health',
        title: 'Complete a full 12-week strength block',
        status: 'done',
        seasonKey: 'spring',
      },
      {
        id: 'goal-health-ms-2',
        goalId: 'goal-health',
        title: 'Train at least 4 times per week for 8 straight weeks',
        status: 'active',
        seasonKey: 'spring',
      },
      {
        id: 'goal-health-ms-3',
        goalId: 'goal-health',
        title: 'Hit a 225 lb squat for a confident single',
        status: 'not_started',
        seasonKey: 'spring',
      },
    ],
    createdFrom: 'ai',
    expanded: true,
  },
  {
    id: 'goal-product',
    title: 'Launched Levyl beta with real users',
    category: 'Product',
    categoryColor: getCategoryColor('Product'),
    seasonKey: 'summer',
    milestones: [
      {
        id: 'goal-product-ms-1',
        goalId: 'goal-product',
        title: 'Ship the core Vision, Seasons, and Today flows',
        status: 'active',
        seasonKey: 'summer',
      },
      {
        id: 'goal-product-ms-2',
        goalId: 'goal-product',
        title: 'Invite 10 beta users and collect structured feedback',
        status: 'not_started',
        seasonKey: 'summer',
      },
    ],
    createdFrom: 'manual',
    expanded: false,
  },
  {
    id: 'goal-family',
    title: 'Took the family trip we kept postponing',
    category: 'Family',
    categoryColor: getCategoryColor('Family'),
    seasonKey: null,
    milestones: [],
    createdFrom: 'ai',
    expanded: false,
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
        id: 'season-ms-1',
        seasonKey: 'spring',
        lifeAreaKey: 'physical',
        title: 'Run a 5K under 30 minutes',
        status: 'done',
        weeklyGoals: mockWeeklyGoals('season-ms-1'),
      },
      {
        id: 'season-ms-2',
        seasonKey: 'spring',
        lifeAreaKey: 'wealth',
        title: 'Build 3-month emergency fund',
        status: 'done',
        weeklyGoals: mockWeeklyGoals('season-ms-2'),
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
        id: 'season-ms-3',
        seasonKey: 'summer',
        lifeAreaKey: 'physical',
        title: 'Hit 3x gym per week',
        status: 'done',
        statusNote: 'Completed week 2',
        weeklyGoals: mockWeeklyGoals('season-ms-3'),
      },
      {
        id: 'season-ms-4',
        seasonKey: 'summer',
        lifeAreaKey: 'wealth',
        title: 'Invest $500 into index fund monthly',
        status: 'active',
        statusNote: 'In progress – 2 months left',
        weeklyGoals: mockWeeklyGoals('season-ms-4'),
      },
      {
        id: 'season-ms-5',
        seasonKey: 'summer',
        lifeAreaKey: 'mind',
        title: 'Read 2 books on mental models',
        status: 'not_started',
        statusNote: 'Not started',
        weeklyGoals: [],
      },
      {
        id: 'season-ms-6',
        seasonKey: 'summer',
        lifeAreaKey: 'community',
        title: 'Attend 2 community events',
        status: 'active',
        statusNote: 'Flagged at risk',
        atRisk: true,
        weeklyGoals: mockWeeklyGoals('season-ms-6'),
      },
      {
        id: 'season-ms-7',
        seasonKey: 'summer',
        lifeAreaKey: 'spiritual',
        title: 'Daily 10-min morning practice',
        status: 'active',
        statusNote: '40% consistency so far',
        weeklyGoals: mockWeeklyGoals('season-ms-7'),
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
        id: 'season-ms-8',
        seasonKey: 'fall',
        lifeAreaKey: 'family',
        title: 'Plan and take family trip',
        status: 'not_started',
        weeklyGoals: [],
      },
      {
        id: 'season-ms-9',
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

const syncGoals = (state: AppState, goals: Goal[]) => ({
  goals,
  user: { ...state.user, goals },
})

const syncYearDescription = (state: AppState, yearDescription: string) => ({
  yearDescription,
  user: { ...state.user, yearDescription },
})

const deriveGoalSeasonKey = (milestones: GoalMilestone[]): SeasonKey | null => {
  if (milestones.length === 0) {
    return null
  }

  const assignedSeasonKeys = milestones.filter(
    (milestone): milestone is GoalMilestone & { seasonKey: SeasonKey } =>
      milestone.seasonKey !== null
  )

  if (assignedSeasonKeys.length !== milestones.length) {
    return null
  }

  const [firstSeason] = assignedSeasonKeys

  return assignedSeasonKeys.every(
    (milestone) => milestone.seasonKey === firstSeason.seasonKey
  )
    ? firstSeason.seasonKey
    : null
}

export const useAppStore = create<AppState>((set) => ({
  user: {
    id: 'user-1',
    name: 'Arsenic',
    currentSeason: 'summer',
    xp: 1240,
    level: 4,
    streak: 12,
    yearDescription: initialYearDescription,
    goals: initialGoals,
  },
  yearDescription: initialYearDescription,
  goals: initialGoals,
  seasons: initialSeasons,
  badges: initialBadges,

  toggleGoalDone: (goalId) =>
    set((state) => ({
      seasons: state.seasons.map((season) => ({
        ...season,
        milestones: season.milestones.map((milestone) => ({
          ...milestone,
          weeklyGoals: milestone.weeklyGoals.map((goal) =>
            goal.id === goalId ? { ...goal, done: !goal.done } : goal
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
        milestones: season.milestones.map((milestone) =>
          milestone.id === milestoneId
            ? {
                ...milestone,
                weeklyGoals: [
                  ...milestone.weeklyGoals,
                  { ...goal, id: crypto.randomUUID(), milestoneId },
                ],
              }
            : milestone
        ),
      })),
    })),

  setYearDescription: (text) =>
    set((state) => syncYearDescription(state, text)),

  addGoal: (goal) =>
    set((state) => syncGoals(state, [...state.goals, goal])),

  removeGoal: (id) =>
    set((state) => syncGoals(state, state.goals.filter((goal) => goal.id !== id))),

  updateGoal: (id, updates) =>
    set((state) =>
      syncGoals(
        state,
        state.goals.map((goal) =>
          goal.id === id ? { ...goal, ...updates } : goal
        )
      )
    ),

  toggleGoalExpanded: (id) =>
    set((state) =>
      syncGoals(
        state,
        state.goals.map((goal) =>
          goal.id === id ? { ...goal, expanded: !goal.expanded } : goal
        )
      )
    ),

  addGoalMilestone: (goalId, milestone) =>
    set((state) =>
      syncGoals(
        state,
        state.goals.map((goal) => {
          if (goal.id !== goalId) {
            return goal
          }

          const nextMilestone: GoalMilestone = {
            ...milestone,
            seasonKey: milestone.seasonKey ?? goal.seasonKey,
          }
          const milestones = [...goal.milestones, nextMilestone]

          return {
            ...goal,
            milestones,
            seasonKey: deriveGoalSeasonKey(milestones),
          }
        })
      )
    ),

  removeGoalMilestone: (goalId, milestoneId) =>
    set((state) =>
      syncGoals(
        state,
        state.goals.map((goal) => {
          if (goal.id !== goalId) {
            return goal
          }

          const milestones = goal.milestones.filter(
            (milestone) => milestone.id !== milestoneId
          )

          return {
            ...goal,
            milestones,
            seasonKey: deriveGoalSeasonKey(milestones),
          }
        })
      )
    ),

  updateGoalMilestone: (goalId, milestoneId, title) =>
    set((state) =>
      syncGoals(
        state,
        state.goals.map((goal) =>
          goal.id === goalId
            ? {
                ...goal,
                milestones: goal.milestones.map((milestone) =>
                  milestone.id === milestoneId
                    ? { ...milestone, title }
                    : milestone
                ),
              }
            : goal
        )
      )
    ),

  assignMilestoneToSeason: (goalId, milestoneId, seasonKey) =>
    set((state) =>
      syncGoals(
        state,
        state.goals.map((goal) => {
          if (goal.id !== goalId) {
            return goal
          }

          const milestones = goal.milestones.map((milestone) =>
            milestone.id === milestoneId
              ? { ...milestone, seasonKey }
              : milestone
          )

          return {
            ...goal,
            milestones,
            seasonKey: deriveGoalSeasonKey(milestones),
          }
        })
      )
    ),
}))
