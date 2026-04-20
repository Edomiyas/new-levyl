import { useState } from 'react'
import { Plus, Trash2, ChevronDown, ChevronUp, Edit2, Loader2, Zap } from 'lucide-react'
import { useAppStore } from '../store/appStore'
import type { Goal, GoalMilestone } from '../types'

const CATEGORY_COLORS = [
  '#5DCAA5', '#A89EF5', '#F5C542', '#AADF4F',
  '#5BA8F5', '#F0739A', '#FF8C42', '#64C8E8'
]

function getCategoryColor(category: string): string {
  let hash = 0
  for (let i = 0; i < category.length; i++) {
    hash = ((hash << 5) - hash) + category.charCodeAt(i)
    hash = hash & hash
  }
  return CATEGORY_COLORS[Math.abs(hash) % CATEGORY_COLORS.length]
}

interface AIGoalResponse {
  goals: Array<{ title: string; category: string }>
}

interface AISuggestedMilestone {
  title: string
  checked: boolean
}

export function Vision() {
  const { user, addGoal, deleteGoal, updateGoal, toggleGoalExpanded, addGoalMilestone, removeGoalMilestone, updateGoalMilestone } = useAppStore()

  // Section 1: Year description
  const [yearDescription, setYearDescription] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)
  const [generationError, setGenerationError] = useState('')

  // Manual goal form
  const [showManualForm, setShowManualForm] = useState(false)
  const [manualTitle, setManualTitle] = useState('')
  const [manualCategory, setManualCategory] = useState('')

  // Milestone management
  const [newMilestoneText, setNewMilestoneText] = useState<Record<string, string>>({})
  const [editingMilestoneId, setEditingMilestoneId] = useState<Record<string, string>>({})
  const [editingMilestoneText, setEditingMilestoneText] = useState<Record<string, string>>({})

  // AI milestone suggestion
  const [suggestingFor, setSuggestingFor] = useState<string | null>(null)
  const [suggestedMilestones, setSuggestedMilestones] = useState<Record<string, AISuggestedMilestone[]>>({})

  const handleGenerateGoals = async () => {
    if (!yearDescription.trim()) {
      setGenerationError('Write something first')
      return
    }

    setIsGenerating(true)
    setGenerationError('')

    try {
      const response = await fetch('http://localhost:3001/api/generate-goals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ yearDescription }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to generate goals')
      }

      const data: AIGoalResponse = await response.json()

      data.goals.forEach((g) => {
        const goal: Goal = {
          id: `goal-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
          title: g.title,
          category: g.category,
          categoryColor: getCategoryColor(g.category),
          milestones: [],
          createdFrom: 'ai',
          expanded: true,
        }
        addGoal(goal)
      })

      setYearDescription('')
    } catch (err) {
      setGenerationError(err instanceof Error ? err.message : 'Could not generate goals. You can add them manually below.')
    } finally {
      setIsGenerating(false)
    }
  }

  const handleAddManualGoal = () => {
    if (!manualTitle.trim() || !manualCategory.trim()) return

    const goal: Goal = {
      id: `goal-${Date.now()}`,
      title: manualTitle.trim(),
      category: manualCategory.trim(),
      categoryColor: getCategoryColor(manualCategory.trim()),
      milestones: [],
      createdFrom: 'manual',
      expanded: true,
    }
    addGoal(goal)
    setManualTitle('')
    setManualCategory('')
    setShowManualForm(false)
  }

  const handleAddMilestone = (goalId: string) => {
    const text = newMilestoneText[goalId]?.trim()
    if (!text) return

    const milestone: GoalMilestone = {
      id: `ms-${Date.now()}`,
      goalId,
      title: text,
      status: 'not_started',
    }
    addGoalMilestone(goalId, milestone)
    setNewMilestoneText((prev) => ({ ...prev, [goalId]: '' }))
  }

  const handleSuggestMilestones = async (goal: Goal) => {
    setSuggestingFor(goal.id)

    try {
      const response = await fetch('http://localhost:3001/api/suggest-milestones', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ goalTitle: goal.title, goalCategory: goal.category }),
      })

      if (!response.ok) throw new Error('Could not suggest milestones')

      const data = await response.json()
      setSuggestedMilestones((prev) => ({
        ...prev,
        [goal.id]: data.milestones.map((m: { title: string }) => ({ title: m.title, checked: true })),
      }))
    } catch (err) {
      console.error('Error suggesting milestones:', err)
    } finally {
      setSuggestingFor(null)
    }
  }

  const handleApplySuggestedMilestones = (goalId: string) => {
    const suggested = suggestedMilestones[goalId]
    if (!suggested) return

    suggested
      .filter((m) => m.checked)
      .forEach((m) => {
        const milestone: GoalMilestone = {
          id: `ms-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
          goalId,
          title: m.title,
          status: 'not_started',
        }
        addGoalMilestone(goalId, milestone)
      })

    setSuggestedMilestones((prev) => {
      const newState = { ...prev }
      delete newState[goalId]
      return newState
    })
  }

  const handleStartEditMilestone = (goalId: string, milestoneId: string, currentTitle: string) => {
    setEditingMilestoneId((prev) => ({ ...prev, [milestoneId]: goalId }))
    setEditingMilestoneText((prev) => ({ ...prev, [milestoneId]: currentTitle }))
  }

  const handleSaveMilestone = (goalId: string, milestoneId: string) => {
    const newTitle = editingMilestoneText[milestoneId]?.trim()
    if (newTitle) {
      updateGoalMilestone(goalId, milestoneId, newTitle)
    }
    setEditingMilestoneId((prev) => {
      const newState = { ...prev }
      delete newState[milestoneId]
      return newState
    })
  }

  return (
    <div className="flex flex-col gap-8">
      {/* Page header */}
      <div>
        <p className="text-sm" style={{ color: 'rgba(255,255,255,0.36)' }}>Your foundation</p>
        <h1 className="text-3xl font-black" style={{ color: '#F0EFEB' }}>Vision 🎯</h1>
      </div>

      {/* SECTION 1: Write your year */}
      <div className="flex flex-col gap-3">
        <div>
          <label className="text-sm font-black" style={{ color: '#F0EFEB' }}>
            Describe your year as if it's already happened
          </label>
          <p className="text-xs mt-1" style={{ color: 'rgba(255,255,255,0.36)' }}>
            Write in past tense — what did you achieve? How did you feel? Be specific.
          </p>
        </div>

        <textarea
          value={yearDescription}
          onChange={(e) => setYearDescription(e.target.value)}
          placeholder="It's December 31st. You're looking back on an incredible year. You hit the gym consistently and finally feel strong. You launched that side project. You took your family on that trip you kept putting off. Write it all out..."
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
            Generate my goals →
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
            Add a goal myself
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
          style={{ background: '#202020', border: '1px solid rgba(255,255,255,0.07)' }}
        >
          <p className="text-sm font-black" style={{ color: '#F0EFEB' }}>Add a goal myself</p>
          <input
            type="text"
            value={manualTitle}
            onChange={(e) => setManualTitle(e.target.value)}
            placeholder="Goal title"
            className="px-4 py-3 rounded-xl text-sm outline-none"
            style={{
              background: '#181818',
              border: '1px solid rgba(255,255,255,0.07)',
              color: '#F0EFEB',
              fontFamily: 'Nunito, sans-serif',
            }}
          />
          <input
            type="text"
            value={manualCategory}
            onChange={(e) => setManualCategory(e.target.value)}
            placeholder="Category (e.g. Health, Career, Family)"
            className="px-4 py-3 rounded-xl text-sm outline-none"
            style={{
              background: '#181818',
              border: '1px solid rgba(255,255,255,0.07)',
              color: '#F0EFEB',
              fontFamily: 'Nunito, sans-serif',
            }}
          />
          <div className="flex gap-2">
            <button
              onClick={handleAddManualGoal}
              disabled={!manualTitle.trim() || !manualCategory.trim()}
              className="flex-1 py-2.5 rounded-lg font-black text-sm transition-all"
              style={{
                background:
                  manualTitle.trim() && manualCategory.trim()
                    ? '#AADF4F'
                    : 'rgba(255,255,255,0.06)',
                color:
                  manualTitle.trim() && manualCategory.trim()
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

      {/* SECTION 2 & 3: Goals and Milestones */}
      {user.goals.length > 0 && (
        <div className="flex flex-col gap-4">
          <h2 className="text-lg font-black" style={{ color: '#F0EFEB' }}>
            Your goals this year
          </h2>

          <div className="flex flex-col gap-3">
            {user.goals.map((goal) => (
              <div key={goal.id}>
                <button
                  onClick={() => toggleGoalExpanded(goal.id)}
                  className="w-full rounded-2xl p-5 text-left transition-all"
                  style={{
                    background: '#181818',
                    border: goal.expanded
                      ? `1px solid ${goal.categoryColor}59`
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
                          {goal.milestones.length} {goal.milestones.length === 1 ? 'milestone' : 'milestones'}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          deleteGoal(goal.id)
                        }}
                        className="p-1.5 rounded-lg transition-all hover:bg-[#202020]"
                        style={{
                          color: 'rgba(255,255,255,0.3)',
                        }}
                      >
                        <Trash2 size={14} />
                      </button>
                      {goal.expanded ? (
                        <ChevronUp size={16} style={{ color: goal.categoryColor }} />
                      ) : (
                        <ChevronDown size={16} style={{ color: 'rgba(255,255,255,0.3)' }} />
                      )}
                    </div>
                  </div>
                </button>

                {/* SECTION 3: Milestones (expanded) */}
                {goal.expanded && (
                  <div className="px-5 pt-3 pb-5 flex flex-col gap-4">
                    {/* AI Suggest button */}
                    <button
                      onClick={() => handleSuggestMilestones(goal)}
                      disabled={suggestingFor === goal.id}
                      className="flex items-center gap-2 py-2 px-3 rounded-lg text-sm font-bold transition-all self-start"
                      style={{
                        background: 'rgba(168,158,245,0.15)',
                        color: '#A89EF5',
                        cursor: suggestingFor === goal.id ? 'not-allowed' : 'pointer',
                      }}
                    >
                      {suggestingFor === goal.id && <Loader2 size={14} className="animate-spin" />}
                      {suggestingFor === goal.id ? 'Suggesting...' : 'Suggest milestones with AI'}
                    </button>

                    {/* AI Suggested Milestones Review Panel */}
                    {suggestedMilestones[goal.id] && (
                      <div
                        className="rounded-xl p-4 flex flex-col gap-3"
                        style={{
                          background: '#202020',
                          border: '1px solid rgba(168,158,245,0.2)',
                        }}
                      >
                        <p className="text-sm font-bold" style={{ color: '#A89EF5' }}>
                          AI suggested these milestones — review and apply
                        </p>
                        <div className="flex flex-col gap-2">
                          {suggestedMilestones[goal.id].map((m, idx) => (
                            <div key={idx} className="flex items-center gap-2">
                              <input
                                type="checkbox"
                                checked={m.checked}
                                onChange={(e) => {
                                  setSuggestedMilestones((prev) => ({
                                    ...prev,
                                    [goal.id]: prev[goal.id].map((item, i) =>
                                      i === idx ? { ...item, checked: e.target.checked } : item
                                    ),
                                  }))
                                }}
                                className="w-4 h-4 rounded cursor-pointer"
                                style={{ accentColor: goal.categoryColor }}
                              />
                              <input
                                type="text"
                                value={m.title}
                                onChange={(e) => {
                                  setSuggestedMilestones((prev) => ({
                                    ...prev,
                                    [goal.id]: prev[goal.id].map((item, i) =>
                                      i === idx ? { ...item, title: e.target.value } : item
                                    ),
                                  }))
                                }}
                                className="flex-1 px-2 py-1 rounded text-sm"
                                style={{
                                  background: '#181818',
                                  border: '1px solid rgba(255,255,255,0.07)',
                                  color: '#F0EFEB',
                                }}
                              />
                            </div>
                          ))}
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleApplySuggestedMilestones(goal.id)}
                            className="flex-1 py-2 rounded-lg font-bold text-sm"
                            style={{ background: '#AADF4F', color: '#0F0F0F' }}
                          >
                            Apply selected milestones
                          </button>
                          <button
                            onClick={() => {
                              setSuggestedMilestones((prev) => {
                                const newState = { ...prev }
                                delete newState[goal.id]
                                return newState
                              })
                            }}
                            className="px-4 py-2 rounded-lg font-bold text-sm"
                            style={{
                              background: 'rgba(255,255,255,0.06)',
                              color: 'rgba(255,255,255,0.5)',
                            }}
                          >
                            Discard
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Milestones List */}
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
                            className="flex items-center justify-between gap-2 p-2 rounded-lg group"
                            style={{
                              background: '#202020',
                              border: '1px solid rgba(255,255,255,0.05)',
                            }}
                          >
                            <div className="flex items-center gap-2 flex-1">
                              <div
                                style={{
                                  width: 6,
                                  height: 6,
                                  borderRadius: '50%',
                                  background:
                                    ms.status === 'done'
                                      ? '#5DCAA5'
                                      : ms.status === 'active'
                                      ? '#AADF4F'
                                      : 'rgba(255,255,255,0.2)',
                                }}
                              />
                              {editingMilestoneId[ms.id] === goal.id ? (
                                <input
                                  type="text"
                                  value={editingMilestoneText[ms.id] || ''}
                                  onChange={(e) =>
                                    setEditingMilestoneText((prev) => ({
                                      ...prev,
                                      [ms.id]: e.target.value,
                                    }))
                                  }
                                  onBlur={() => handleSaveMilestone(goal.id, ms.id)}
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter') handleSaveMilestone(goal.id, ms.id)
                                    if (e.key === 'Escape')
                                      setEditingMilestoneId((prev) => {
                                        const newState = { ...prev }
                                        delete newState[ms.id]
                                        return newState
                                      })
                                  }}
                                  className="flex-1 px-2 py-1 rounded text-sm"
                                  style={{
                                    background: '#181818',
                                    border: '1px solid rgba(255,255,255,0.07)',
                                    color: '#F0EFEB',
                                  }}
                                  autoFocus
                                />
                              ) : (
                                <p className="text-sm" style={{ color: 'rgba(255,255,255,0.8)' }}>
                                  {ms.title}
                                </p>
                              )}
                            </div>
                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              {editingMilestoneId[ms.id] !== goal.id && (
                                <button
                                  onClick={() => handleStartEditMilestone(goal.id, ms.id, ms.title)}
                                  className="p-1 rounded transition-all hover:bg-[#181818]"
                                  style={{ color: 'rgba(255,255,255,0.3)' }}
                                >
                                  <Edit2 size={12} />
                                </button>
                              )}
                              <button
                                onClick={() => removeGoalMilestone(goal.id, ms.id)}
                                className="p-1 rounded transition-all hover:bg-[#181818]"
                                style={{ color: 'rgba(255,255,255,0.3)' }}
                              >
                                <Trash2 size={12} />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Add milestone form */}
                    <div className="flex gap-2 pt-2">
                      <input
                        type="text"
                        value={newMilestoneText[goal.id] || ''}
                        onChange={(e) =>
                          setNewMilestoneText((prev) => ({
                            ...prev,
                            [goal.id]: e.target.value,
                          }))
                        }
                        placeholder="What needs to happen to achieve this goal?"
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
                          cursor: newMilestoneText[goal.id]?.trim() ? 'pointer' : 'not-allowed',
                        }}
                      >
                        <Plus size={12} />
                        Add
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>

          <button
            onClick={() => setShowManualForm(true)}
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
