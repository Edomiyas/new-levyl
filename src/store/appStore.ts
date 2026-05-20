import { create } from 'zustand'
import {
  getCurrentSeasonKey,
  getCurrentWeekInSeason,
  getSeasonStatus,
  SEASON_ORDER,
} from '../lib/constants'
import type {
  Badge,
  Goal,
  GoalMilestone,
  MoodEntry,
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
  moodLog: MoodEntry[]
  badges: Badge[]
  toggleGoalDone: (goalId: string) => void
  addWeeklyGoal: (milestoneId: string, goal: WeeklyGoal) => void
  logMood: (entry: MoodEntry) => void
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

const initialCurrentSeason = getCurrentSeasonKey()

const initialSeasons: Season[] = SEASON_ORDER.map((seasonKey) => {
  const status = getSeasonStatus(seasonKey)
  const currentWeek = getCurrentWeekInSeason(seasonKey)

  return {
    key: seasonKey,
    status,
    weeksDone: status === 'done' ? 12 : status === 'current' ? Math.max(currentWeek - 1, 0) : 0,
    currentWeek,
  }
})

const initialBadges: Badge[] = [
  { id: 'b1', icon: '🏋️', label: 'First lift', earned: true },
  { id: 'b2', icon: '🧠', label: 'Mind seed', earned: true },
  { id: 'b3', icon: '💰', label: 'First invest', earned: true },
  { id: 'b4', icon: '⭐', label: '10 wk streak', earned: false },
  { id: 'b5', icon: '🌸', label: 'Full bloom', earned: false },
  { id: 'b6', icon: '🏆', label: 'Season done', earned: false },
]
const initialMoodLog: MoodEntry[] = []

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
    currentSeason: initialCurrentSeason,
    xp: 1240,
    level: 4,
    streak: 12,
    yearDescription: initialYearDescription,
    goals: initialGoals,
  },
  yearDescription: initialYearDescription,
  goals: initialGoals,
  seasons: initialSeasons,
  moodLog: initialMoodLog,
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

  logMood: (entry) =>
    set((state) => ({
      moodLog: [
        ...state.moodLog.filter((moodEntry) => moodEntry.date !== entry.date),
        entry,
      ].sort((a, b) => a.date.localeCompare(b.date)),
    })),

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
