export interface User {
  id: string
  name: string
  currentSeason: SeasonKey
  xp: number
  level: number
  streak: number
  visionStatement: string
  goals: Goal[]
}

export interface Goal {
  id: string
  title: string
  category: string        // free text, dynamic category
  categoryColor: string   // auto-assigned hex
  milestones: Milestone[]
  createdFrom: 'ai' | 'manual'
}

export type LifeAreaKey = 'physical' | 'mind' | 'spiritual' | 'wealth' | 'community' | 'family'
export type SeasonKey = 'spring' | 'summer' | 'fall' | 'winter'
export type SeasonStatus = 'done' | 'current' | 'upcoming' | 'overdue'

export interface Season {
  key: SeasonKey
  status: SeasonStatus
  weeksDone: number
  currentWeek: number | null
  milestones: Milestone[]
}

export interface Milestone {
  id: string
  seasonKey: SeasonKey
  lifeAreaKey: LifeAreaKey
  title: string
  status: 'not_started' | 'active' | 'done'
  carriedOver?: boolean
  statusNote?: string
  atRisk?: boolean
  weeklyGoals: WeeklyGoal[]
}

export interface WeeklyGoal {
  id: string
  milestoneId: string
  weekNumber: number
  title: string
  successCriteria: string
  done: boolean
}

export interface Badge {
  id: string
  icon: string
  label: string
  earned: boolean
}
