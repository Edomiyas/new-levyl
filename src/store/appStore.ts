import { create } from 'zustand'
import type {
  Badge,
  Goal,
  GoalMilestone,
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
  addWeeklyGoal: (milestoneId: string, goal: WeeklyGoal) => void
  setYearDescription: (text: string) => void
  replaceGoals: (goals: Goal[]) => void
  addGoal: (goal: Goal) => void
  removeGoal: (id: string) => void
  updateGoal: (id: string, updates: Partial<Goal>) => void
  toggleGoalExpanded: (id: string) => void
  addGoalMilestone: (goalId: string, milestone: GoalMilestone) => void
  removeGoalMilestone: (goalId: string, milestoneId: string) => void
  updateGoalMilestone: (
    goalId: string,
    milestoneId: string,
    updates: Partial<GoalMilestone>
  ) => void
  updateMilestoneStatus: (
    goalId: string,
    milestoneId: string,
    status: GoalMilestone['status']
  ) => void
  assignMilestoneToSeason: (
    goalId: string,
    milestoneId: string,
    seasonKey: SeasonKey
  ) => void
}

const initialYearDescription =
  "It’s December 31st, and I’m proud of how grounded this year felt. I rebuilt my strength and finally made the gym a steady part of life. I shipped the first real version of Levyl, got it into people’s hands, and learned from honest feedback instead of hiding in planning mode. I built healthier money habits, protected time for my family, and followed through on the trip we kept putting off. More than anything, I became someone who finished what mattered."

const initialGoals: Goal[] = []

const initialSeasons: Season[] = [
  {
    key: 'spring',
    status: 'done',
    weeksDone: 12,
    currentWeek: null,
  },
  {
    key: 'summer',
    status: 'overdue',
    weeksDone: 3,
    currentWeek: 4,
  },
  {
    key: 'fall',
    status: 'upcoming',
    weeksDone: 0,
    currentWeek: null,
  },
  {
    key: 'winter',
    status: 'upcoming',
    weeksDone: 0,
    currentWeek: null,
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
    set((state) =>
      syncGoals(
        state,
        state.goals.map((goal) => ({
          ...goal,
          milestones: goal.milestones.map((milestone) => ({
            ...milestone,
            weeklyGoals: milestone.weeklyGoals.map((weeklyGoal) =>
              weeklyGoal.id === goalId
                ? { ...weeklyGoal, done: !weeklyGoal.done }
                : weeklyGoal
            ),
          })),
        }))
      )
    ),

  addWeeklyGoal: (milestoneId, goal) =>
    set((state) =>
      syncGoals(
        state,
        state.goals.map((goalEntry) => ({
          ...goalEntry,
          milestones: goalEntry.milestones.map((milestone) =>
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
        }))
      )
    ),

  setYearDescription: (text) =>
    set((state) => syncYearDescription(state, text)),

  replaceGoals: (goals) =>
    set((state) => syncGoals(state, goals)),

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

          return {
            ...goal,
            milestones: [...goal.milestones, milestone],
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

          return {
            ...goal,
            milestones: goal.milestones.filter(
              (milestone) => milestone.id !== milestoneId
            ),
          }
        })
      )
    ),

  updateGoalMilestone: (goalId, milestoneId, updates) =>
    set((state) =>
      syncGoals(
        state,
        state.goals.map((goal) =>
          goal.id === goalId
            ? {
                ...goal,
                milestones: goal.milestones.map((milestone) =>
                  milestone.id === milestoneId
                    ? { ...milestone, ...updates }
                    : milestone
                ),
              }
            : goal
        )
      )
    ),

  updateMilestoneStatus: (goalId, milestoneId, status) =>
    set((state) =>
      syncGoals(
        state,
        state.goals.map((goal) =>
          goal.id === goalId
            ? {
                ...goal,
                milestones: goal.milestones.map((milestone) =>
                  milestone.id === milestoneId
                    ? { ...milestone, status }
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

          return {
            ...goal,
            milestones: goal.milestones.map((milestone) =>
              milestone.id === milestoneId
                ? { ...milestone, seasonKey }
                : milestone
            ),
          }
        })
      )
    ),
}))
