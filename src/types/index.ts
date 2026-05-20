export interface User {
  id: string
  name: string
  currentSeason: SeasonKey
  xp: number
  level: number
  streak: number
  yearDescription: string
  goals: Goal[]
}

export interface Goal {
  id: string
  title: string
  category: string
  categoryColor: string
  milestones: GoalMilestone[]
  createdFrom: 'ai' | 'manual'
  expanded: boolean
}

export interface GoalMilestone {
  id: string
  goalId: string
  title: string
  description: string
  status: 'not_started' | 'active' | 'done'
  seasonKey: SeasonKey | null
  weeklyGoals: WeeklyGoal[]
}

export type LifeAreaKey = 'physical' | 'mind' | 'spiritual' | 'wealth' | 'community' | 'family'
export type SeasonKey = 'spring' | 'summer' | 'fall' | 'winter'
export type SeasonStatus = 'done' | 'current' | 'upcoming' | 'overdue'

export interface Season {
  key: SeasonKey
  status: SeasonStatus
  weeksDone: number
  currentWeek: number | null
}

export interface WeeklyGoal {
  id: string
  milestoneId: string
  weekNumber: number
  title: string
  successCriteria: string
  done: boolean
}

export interface MoodEntry {
  date: string
  emoji: string
  note: string
}

export interface Badge {
  id: string
  icon: string
  label: string
  earned: boolean
}
