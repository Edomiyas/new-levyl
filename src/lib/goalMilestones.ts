import type { Goal, GoalMilestone, SeasonKey } from '../types'

export interface SeasonGoalMilestone extends GoalMilestone {
  goalTitle: string
  goalCategory: string
  goalCategoryColor: string
}

export interface SeasonGoalGroup {
  goalId: string
  goalTitle: string
  category: string
  categoryColor: string
  milestones: SeasonGoalMilestone[]
}

export function getSeasonGoalGroups(
  goals: Goal[],
  seasonKey: SeasonKey
): SeasonGoalGroup[] {
  return goals
    .map((goal) => {
      const milestones = goal.milestones
        .filter((milestone) => milestone.seasonKey === seasonKey)
        .map((milestone) => ({
          ...milestone,
          goalTitle: goal.title,
          goalCategory: goal.category,
          goalCategoryColor: goal.categoryColor,
        }))

      if (milestones.length === 0) {
        return null
      }

      return {
        goalId: goal.id,
        goalTitle: goal.title,
        category: goal.category,
        categoryColor: goal.categoryColor,
        milestones,
      }
    })
    .filter((group): group is SeasonGoalGroup => group !== null)
}

export function getSeasonGoalMilestones(
  goals: Goal[],
  seasonKey: SeasonKey
): SeasonGoalMilestone[] {
  return getSeasonGoalGroups(goals, seasonKey).flatMap((group) => group.milestones)
}
