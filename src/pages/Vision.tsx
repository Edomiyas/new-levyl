import { useState } from 'react'
import { Plus, Trash2, ChevronDown, ChevronUp, Loader2 } from 'lucide-react'
import { useAppStore } from '../store/appStore'
import type { Goal, Milestone } from '../types'

// Category color palette
const CATEGORY_COLORS = [
  '#5DCAA5', '#A89EF5', '#F5C542', '#AADF4F',
  '#5BA8F5', '#F0739A', '#FF8C42', '#64C8E8'
]

// Generate deterministic color based on category name
const getCategoryColor = (category: string): string => {
  let hash = 0
  for (let i = 0; i < category.length; i++) {
    hash = ((hash << 5) - hash) + category.charCodeAt(i)
    hash = hash & hash // Convert to 32bit integer
  }
  const index = Math.abs(hash) % CATEGORY_COLORS.length
  return CATEGORY_COLORS[index]
}

interface ParsedGoalsResponse {
  goals: Array<{
    title: string
    category: string
    rationale: string
  }>
}

export function Vision() {
  const { user, addGoal, addMilestoneToGoal, deleteGoal, updateGoal, deleteMilestoneFromGoal } = useAppStore()
  const [yearDescription, setYearDescription] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)
  const [generationError, setGenerationError] = useState('')
  const [showManualForm, setShowManualForm] = useState(false)
  const [manualGoalTitle, setManualGoalTitle] = useState('')
  const [manualGoalCategory, setManualGoalCategory] = useState('')
  const [expandedGoalId, setExpandedGoalId] = useState<string | null>(null)
  const [newMilestoneText, setNewMilestoneText] = useState<Record<string, string>>({})

  const handleGenerateGoals = async () => {
    if (!yearDescription.trim()) return

    const apiKey = import.meta.env.VITE_ANTHROPIC_API_KEY

    if (!apiKey) {
      setGenerationError('API key not configured. Please set VITE_ANTHROPIC_API_KEY environment variable.')
      return
    }

    setIsGenerating(true)
    setGenerationError('')

    try {
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
        },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 1000,
          system: `You are a goal-setting assistant. The user will describe their ideal year. Extract specific, actionable goals from their description. Each goal must have a title and a category. Categories are dynamic — infer them from what the user wrote (e.g. 'Health & Fitness', 'Financial', 'Family', 'Career', 'Relationships', 'Learning', 'Spiritual', 'Creative', 'Travel', 'Community'). Do not use a fixed list — only use categories that genuinely appear in what the user wrote. Return ONLY valid JSON, no markdown, no explanation. Format: { "goals": [{ "title": string, "category": string, "rationale": string }] }`,
          messages: [{ role: 'user', content: yearDescription }],
        }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(`API error ${response.status}: ${errorData.error?.message || response.statusText}`)
      }

      const data = await response.json()
      const content = data.content[0].text
      const parsed: ParsedGoalsResponse = JSON.parse(content)

      // Add each generated goal
      parsed.goals.forEach((g) => {
        const goal: Goal = {
          id: `goal-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
          title: g.title,
          category: g.category,
          categoryColor: getCategoryColor(g.category),
          milestones: [],
          createdFrom: 'ai',
        }
        addGoal(goal)
      })

      setYearDescription('')
      setIsGenerating(false)
    } catch (err) {
      setGenerationError(err instanceof Error ? err.message : 'Failed to generate goals')
      setIsGenerating(false)
    }
  }

  const handleAddManualGoal = () => {
    if (!manualGoalTitle.trim() || !manualGoalCategory.trim()) return

    const goal: Goal = {
      id: `goal-${Date.now()}`,
      title: manualGoalTitle.trim(),
      category: manualGoalCategory.trim(),
      categoryColor: getCategoryColor(manualGoalCategory.trim()),
      milestones: [],
      createdFrom: 'manual',
    }
    addGoal(goal)
    setManualGoalTitle('')
    setManualGoalCategory('')
    setShowManualForm(false)
  }

  const handleAddMilestone = (goalId: string) => {
    const text = newMilestoneText[goalId]?.trim()
    if (!text) return

    const milestone: Milestone = {
      id: `ms-${Date.now()}`,
      seasonKey: user.currentSeason,
      lifeAreaKey: 'physical', // Default, user can reassign in Seasons page
      title: text,
      status: 'not_started',
      weeklyGoals: [],
    }
    addMilestoneToGoal(goalId, milestone)
    setNewMilestoneText((prev) => ({ ...prev, [goalId]: '' }))
  }

  return (
    <div className="flex flex-col gap-8">
      {/* Page header */}
      <div>
        <p className="text-sm" style={{ color: 'rgba(255,255,255,0.36)' }}>Your foundation</p>
        <h1 className="text-3xl font-black" style={{ color: '#F0EFEB' }}>Vision 🎯</h1>
      </div>

      {/* STAGE 1: Write your year */}
      <div className="flex flex-col gap-3">
        <label className="text-sm font-black" style={{ color: '#F0EFEB' }}>
          Describe your year as if it's already happened
        </label>
        <textarea
          value={yearDescription}
          onChange={(e) => setYearDescription(e.target.value)}
          placeholder="It's December 31st. You're looking back on this year. What did you accomplish? How did you feel? What changed? Write it all out — big and small..."
          className="w-full rounded-2xl px-4 py-4 text-sm font-medium outline-none resize-none"
          rows={8}
          style={{
            background: '#181818',
            border: '1px solid rgba(255,255,255,0.07)',
            color: '#F0EFEB',
            fontFamily: 'Nunito, sans-serif',
          }}
        />
        <div className="flex gap-3">
          <button
            onClick={handleGenerateGoals}
            disabled={!yearDescription.trim() || isGenerating}
            className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-black text-sm transition-all"
            style={{
              background: !yearDescription.trim() || isGenerating ? '#AADF4F33' : '#AADF4F',
              color: !yearDescription.trim() || isGenerating ? 'rgba(255,255,255,0.3)' : '#0F0F0F',
              cursor: !yearDescription.trim() || isGenerating ? 'not-allowed' : 'pointer',
            }}
          >
            {isGenerating && <Loader2 size={16} className="animate-spin" />}
            Generate my goals from this →
          </button>
          <button
            onClick={() => setShowManualForm(!showManualForm)}
            className="px-4 py-3 rounded-xl font-black text-sm transition-all"
            style={{
              background: 'transparent',
              border: '1px solid rgba(255,255,255,0.07)',
              color: 'rgba(255,255,255,0.5)',
            }}
          >
            Add a goal manually
          </button>
        </div>
        {generationError && (
          <div
            className="rounded-xl p-3 text-sm"
            style={{ background: 'rgba(240,120,120,0.1)', color: '#FF6B6B' }}
          >
            {generationError}
          </div>
        )}
      </div>

      {/* Manual goal form */}
      {showManualForm && (
        <div
          className="rounded-2xl p-5 flex flex-col gap-3"
          style={{ background: '#181818', border: '1px solid rgba(255,255,255,0.07)' }}
        >
          <p className="text-sm font-black" style={{ color: '#F0EFEB' }}>Add a goal manually</p>
          <input
            type="text"
            value={manualGoalTitle}
            onChange={(e) => setManualGoalTitle(e.target.value)}
            placeholder="What's the goal?"
            className="px-4 py-3 rounded-xl text-sm outline-none"
            style={{
              background: '#202020',
              border: '1px solid rgba(255,255,255,0.07)',
              color: '#F0EFEB',
              fontFamily: 'Nunito, sans-serif',
            }}
          />
          <input
            type="text"
            value={manualGoalCategory}
            onChange={(e) => setManualGoalCategory(e.target.value)}
            placeholder="Category (e.g. Health, Career, Family)"
            className="px-4 py-3 rounded-xl text-sm outline-none"
            style={{
              background: '#202020',
              border: '1px solid rgba(255,255,255,0.07)',
              color: '#F0EFEB',
              fontFamily: 'Nunito, sans-serif',
            }}
          />
          <div className="flex gap-2">
            <button
              onClick={handleAddManualGoal}
              disabled={!manualGoalTitle.trim() || !manualGoalCategory.trim()}
              className="flex-1 py-2.5 rounded-lg font-black text-sm transition-all"
              style={{
                background:
                  manualGoalTitle.trim() && manualGoalCategory.trim()
                    ? '#AADF4F'
                    : 'rgba(255,255,255,0.06)',
                color:
                  manualGoalTitle.trim() && manualGoalCategory.trim()
                    ? '#0F0F0F'
                    : 'rgba(255,255,255,0.2)',
              }}
            >
              Save goal
            </button>
            <button
              onClick={() => setShowManualForm(false)}
              className="px-4 py-2.5 rounded-lg font-black text-sm"
              style={{
                background: 'rgba(255,255,255,0.06)',
                color: 'rgba(255,255,255,0.4)',
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* STAGE 2: Goals */}
      {user.goals.length > 0 && (
        <div className="flex flex-col gap-4">
          <h2 className="text-lg font-black" style={{ color: '#F0EFEB' }}>
            Your goals for the year
          </h2>

          <div className="flex flex-col gap-3">
            {user.goals.map((goal) => {
              const isExpanded = expandedGoalId === goal.id
              const milestonesCount = goal.milestones.length

              return (
                <div key={goal.id}>
                  <button
                    onClick={() => setExpandedGoalId(isExpanded ? null : goal.id)}
                    className="w-full rounded-2xl p-5 text-left transition-all"
                    style={{
                      background: '#181818',
                      border: isExpanded
                        ? `1px solid ${goal.categoryColor}4D`
                        : '1px solid rgba(255,255,255,0.07)',
                      cursor: 'pointer',
                    }}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <p className="text-base font-bold" style={{ color: '#F0EFEB' }}>
                          {goal.title}
                        </p>
                        <div className="flex items-center gap-2 mt-2">
                          <span
                            className="text-[10px] font-black px-2.5 py-1 rounded-full"
                            style={{
                              background: `${goal.categoryColor}1F`,
                              color: goal.categoryColor,
                            }}
                          >
                            {goal.category}
                          </span>
                          <span className="text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>
                            {milestonesCount} {milestonesCount === 1 ? 'milestone' : 'milestones'}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            deleteGoal(goal.id)
                          }}
                          className="p-1.5 rounded-lg transition-all"
                          style={{
                            background: 'rgba(255,255,255,0.05)',
                            color: 'rgba(255,255,255,0.3)',
                          }}
                        >
                          <Trash2 size={14} />
                        </button>
                        {isExpanded ? (
                          <ChevronUp size={16} style={{ color: goal.categoryColor }} />
                        ) : (
                          <ChevronDown size={16} style={{ color: 'rgba(255,255,255,0.3)' }} />
                        )}
                      </div>
                    </div>
                  </button>

                  {/* STAGE 3: Milestones (expanded) */}
                  {isExpanded && (
                    <div className="px-5 pt-3 pb-5 flex flex-col gap-3">
                      {goal.milestones.length === 0 ? (
                        <p
                          className="text-sm py-3"
                          style={{ color: 'rgba(255,255,255,0.28)', textAlign: 'center' }}
                        >
                          No milestones yet
                        </p>
                      ) : (
                        <div className="flex flex-col gap-2">
                          {goal.milestones.map((ms) => (
                            <div
                              key={ms.id}
                              className="flex items-center justify-between gap-2 p-2 rounded-lg"
                              style={{
                                background: '#202020',
                                border: '1px solid rgba(255,255,255,0.05)',
                              }}
                            >
                              <div className="flex-1 min-w-0">
                                <p
                                  className="text-sm"
                                  style={{ color: 'rgba(255,255,255,0.8)' }}
                                >
                                  {ms.title}
                                </p>
                                <p className="text-xs" style={{ color: 'rgba(255,255,255,0.25)' }}>
                                  {ms.status === 'not_started'
                                    ? 'Not started'
                                    : ms.status === 'active'
                                    ? 'Active'
                                    : 'Done'}
                                </p>
                              </div>
                              <button
                                onClick={() => deleteMilestoneFromGoal(goal.id, ms.id)}
                                className="p-1 rounded text-xs"
                                style={{ color: 'rgba(255,255,255,0.3)' }}
                              >
                                <Trash2 size={12} />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Add milestone form */}
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={newMilestoneText[goal.id] || ''}
                          onChange={(e) =>
                            setNewMilestoneText((prev) => ({
                              ...prev,
                              [goal.id]: e.target.value,
                            }))
                          }
                          placeholder="Add a milestone..."
                          className="flex-1 px-3 py-2 rounded-lg text-xs outline-none"
                          style={{
                            background: '#181818',
                            border: '1px solid rgba(255,255,255,0.07)',
                            color: '#F0EFEB',
                            fontFamily: 'Nunito, sans-serif',
                          }}
                        />
                        <button
                          onClick={() => handleAddMilestone(goal.id)}
                          disabled={!newMilestoneText[goal.id]?.trim()}
                          className="px-3 py-2 rounded-lg font-bold text-xs flex items-center gap-1 transition-all"
                          style={{
                            background: newMilestoneText[goal.id]?.trim()
                              ? goal.categoryColor
                              : 'rgba(255,255,255,0.06)',
                            color: newMilestoneText[goal.id]?.trim()
                              ? '#0F0F0F'
                              : 'rgba(255,255,255,0.2)',
                          }}
                        >
                          <Plus size={12} />
                          Add
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>

          <button
            onClick={() => setShowManualForm(!showManualForm)}
            className="flex items-center justify-center gap-2 py-3 rounded-xl font-black text-sm transition-all"
            style={{
              background: 'transparent',
              border: '1px solid rgba(255,255,255,0.07)',
              color: 'rgba(255,255,255,0.5)',
            }}
          >
            <Plus size={14} />
            Add another goal
          </button>
        </div>
      )}
    </div>
  )
}
