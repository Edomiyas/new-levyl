import { useState } from 'react'
import {
  Check,
  ChevronDown,
  ChevronUp,
  Edit2,
  Loader2,
  Plus,
  Trash2,
  X,
  Zap,
} from 'lucide-react'
import { getCategoryColor, SEASONS, SEASON_ORDER } from '../lib/constants'
import { useAppStore } from '../store/appStore'
import type { AISuggestionPanel, Goal, GoalMilestone, SeasonKey } from '../types'

interface AnthropicResponse {
  content?: Array<
    | {
        type: 'text'
        text: string
      }
    | {
        type: string
      }
  >
}

interface GenerateGoalsResponse {
  goals: Array<{ title: string; category: string }>
}

interface SuggestMilestonesResponse {
  milestones: Array<{ title: string }>
}

interface InferCategoryResponse {
  category: string
}

interface SeasonPlanItem {
  goalId: string
  seasonKey: SeasonKey
  reason: string
}

interface SeasonPlanResponse {
  plan: SeasonPlanItem[]
}

const ERROR_BANNER_STYLES = {
  background: 'rgba(240,115,154,0.1)',
  border: '1px solid rgba(240,115,154,0.3)',
  color: '#F0739A',
} as const

const INPUT_STYLES = {
  background: '#202020',
  border: '1px solid rgba(255,255,255,0.07)',
  color: '#F0EFEB',
  fontFamily: 'Nunito, sans-serif',
} as const

const CARD_STYLES = {
  background: '#181818',
  border: '1px solid rgba(255,255,255,0.07)',
} as const

function createId(prefix: string) {
  return `${prefix}-${crypto.randomUUID()}`
}

function getAnthropicApiKey() {
  return import.meta.env.VITE_ANTHROPIC_API_KEY?.trim()
}

function extractAnthropicText(response: AnthropicResponse) {
  const text = response.content
    ?.filter((block): block is { type: 'text'; text: string } => block.type === 'text')
    .map((block) => block.text)
    .join('\n')
    .trim()

  if (!text) {
    throw new Error('Anthropic returned an empty response')
  }

  if (!text.startsWith('```')) {
    return text
  }

  return text.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim()
}

async function fetchAnthropicJson<T>({
  system,
  maxTokens,
  message,
}: {
  system: string
  maxTokens: number
  message: string
}) {
  const apiKey = getAnthropicApiKey()

  if (!apiKey) {
    throw new Error('Missing Anthropic API key')
  }

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-20250514',
      max_tokens: maxTokens,
      system,
      messages: [{ role: 'user', content: message }],
    }),
  })

  if (!response.ok) {
    throw new Error(await response.text())
  }

  const data = (await response.json()) as AnthropicResponse

  return JSON.parse(extractAnthropicText(data)) as T
}

function getSeasonBadge(seasonKey: SeasonKey | null) {
  if (!seasonKey) {
    return null
  }

  return SEASONS[seasonKey]
}

function getMilestoneStatusColor(status: GoalMilestone['status']) {
  if (status === 'done') {
    return '#5DCAA5'
  }

  if (status === 'active') {
    return '#AADF4F'
  }

  return 'rgba(255,255,255,0.2)'
}

export function Vision() {
  const yearDescription = useAppStore((state) => state.yearDescription)
  const goals = useAppStore((state) => state.goals)
  const setYearDescription = useAppStore((state) => state.setYearDescription)
  const addGoal = useAppStore((state) => state.addGoal)
  const removeGoal = useAppStore((state) => state.removeGoal)
  const updateGoal = useAppStore((state) => state.updateGoal)
  const toggleGoalExpanded = useAppStore((state) => state.toggleGoalExpanded)
  const addGoalMilestone = useAppStore((state) => state.addGoalMilestone)
  const removeGoalMilestone = useAppStore((state) => state.removeGoalMilestone)
  const updateGoalMilestone = useAppStore((state) => state.updateGoalMilestone)
  const assignMilestoneToSeason = useAppStore(
    (state) => state.assignMilestoneToSeason
  )

  const [isGeneratingGoals, setIsGeneratingGoals] = useState(false)
  const [generationError, setGenerationError] = useState('')
  const [showManualForm, setShowManualForm] = useState(false)
  const [manualTitle, setManualTitle] = useState('')
  const [manualCategory, setManualCategory] = useState('')
  const [manualError, setManualError] = useState('')
  const [isSavingManualGoal, setIsSavingManualGoal] = useState(false)
  const [newMilestoneTitles, setNewMilestoneTitles] = useState<Record<string, string>>(
    {}
  )
  const [editingGoalId, setEditingGoalId] = useState<string | null>(null)
  const [editingGoalTitle, setEditingGoalTitle] = useState('')
  const [confirmingDeleteGoalId, setConfirmingDeleteGoalId] = useState<string | null>(
    null
  )
  const [editingMilestone, setEditingMilestone] = useState<{
    goalId: string
    milestoneId: string
    title: string
  } | null>(null)
  const [suggestionPanels, setSuggestionPanels] = useState<
    Record<string, AISuggestionPanel>
  >({})
  const [suggestingGoalId, setSuggestingGoalId] = useState<string | null>(null)
  const [suggestionErrors, setSuggestionErrors] = useState<Record<string, string>>({})
  const [seasonPlan, setSeasonPlan] = useState<SeasonPlanItem[] | null>(null)
  const [approvedPlanGoals, setApprovedPlanGoals] = useState<Record<string, boolean>>(
    {}
  )
  const [isPlanningYear, setIsPlanningYear] = useState(false)
  const [planError, setPlanError] = useState('')

  const visiblePlan =
    seasonPlan?.filter((item) => goals.some((goal) => goal.id === item.goalId)) ?? []

  const approvedPlanCount = visiblePlan.filter(
    (item) => approvedPlanGoals[item.goalId]
  ).length

  const resetManualForm = () => {
    setManualTitle('')
    setManualCategory('')
    setManualError('')
    setShowManualForm(false)
  }

  const handleGenerateGoals = async () => {
    if (!yearDescription.trim()) {
      return
    }

    setIsGeneratingGoals(true)
    setGenerationError('')

    try {
      const data = await fetchAnthropicJson<GenerateGoalsResponse>({
        system:
          'You are a goal extraction assistant. The user wrote their ideal year in past tense. Extract 4-7 specific meaningful goals. Categories must be inferred from what they actually wrote — do not use a fixed list. Only include categories genuinely present in the text. Return ONLY valid JSON with no markdown or explanation: { "goals": [{ "title": string, "category": string }] }',
        maxTokens: 1000,
        message: yearDescription,
      })

      const seen = new Set(
        goals.map(
          (goal) => `${goal.title.toLowerCase().trim()}::${goal.category.toLowerCase().trim()}`
        )
      )

      data.goals.forEach((item) => {
        const title = item.title.trim()
        const category = item.category.trim()

        if (!title || !category) {
          return
        }

        const key = `${title.toLowerCase()}::${category.toLowerCase()}`

        if (seen.has(key)) {
          return
        }

        seen.add(key)

        addGoal({
          id: createId('goal'),
          title,
          category,
          categoryColor: getCategoryColor(category),
          seasonKey: null,
          milestones: [],
          createdFrom: 'ai',
          expanded: true,
        })
      })
    } catch {
      setGenerationError('Could not generate goals — try again or add manually')
    } finally {
      setIsGeneratingGoals(false)
    }
  }

  const handleStartGoalEdit = (goal: Goal) => {
    setEditingGoalId(goal.id)
    setEditingGoalTitle(goal.title)
    setConfirmingDeleteGoalId(null)
  }

  const handleSaveGoalTitle = () => {
    if (!editingGoalId) {
      return
    }

    const nextTitle = editingGoalTitle.trim()

    if (nextTitle) {
      updateGoal(editingGoalId, { title: nextTitle })
    }

    setEditingGoalId(null)
    setEditingGoalTitle('')
  }

  const handleAddMilestone = (goal: Goal) => {
    const title = newMilestoneTitles[goal.id]?.trim()

    if (!title) {
      return
    }

    addGoalMilestone(goal.id, {
      id: createId('goal-milestone'),
      goalId: goal.id,
      title,
      status: 'not_started',
      seasonKey: goal.seasonKey,
    })

    setNewMilestoneTitles((current) => ({ ...current, [goal.id]: '' }))
  }

  const handleSuggestMilestones = async (goal: Goal) => {
    setSuggestingGoalId(goal.id)
    setSuggestionErrors((current) => ({ ...current, [goal.id]: '' }))
    setSuggestionPanels((current) => ({
      ...current,
      [goal.id]: {
        goalId: goal.id,
        suggestions: current[goal.id]?.suggestions ?? [],
        visible: true,
      },
    }))

    try {
      const data = await fetchAnthropicJson<SuggestMilestonesResponse>({
        system:
          'You are a milestone planning assistant. Given a goal and the user\'s broader year vision, suggest 3-5 concrete milestones. Each milestone should be a specific, measurable outcome — not a task or habit. Return ONLY valid JSON: { "milestones": [{ "title": string }] }',
        maxTokens: 800,
        message: `Goal: ${goal.title}\nCategory: ${goal.category}\nYear vision: ${yearDescription}`,
      })

      setSuggestionPanels((current) => ({
        ...current,
        [goal.id]: {
          goalId: goal.id,
          visible: true,
          suggestions: data.milestones
            .map((milestone) => milestone.title.trim())
            .filter(Boolean)
            .map((title) => ({
              id: createId('ai-suggestion'),
              title,
              selected: true,
              editing: false,
            })),
        },
      }))
    } catch {
      setSuggestionErrors((current) => ({
        ...current,
        [goal.id]: 'Could not suggest milestones right now',
      }))
    } finally {
      setSuggestingGoalId(null)
    }
  }

  const handleApplySuggestions = (goal: Goal) => {
    const panel = suggestionPanels[goal.id]

    if (!panel) {
      return
    }

    panel.suggestions
      .filter((suggestion) => suggestion.selected && suggestion.title.trim())
      .forEach((suggestion) => {
        addGoalMilestone(goal.id, {
          id: createId('goal-milestone'),
          goalId: goal.id,
          title: suggestion.title.trim(),
          status: 'not_started',
          seasonKey: goal.seasonKey,
        })
      })

    setSuggestionPanels((current) => {
      const nextPanels = { ...current }
      delete nextPanels[goal.id]
      return nextPanels
    })
  }

  const handleSaveManualGoal = async () => {
    const title = manualTitle.trim()

    if (!title) {
      return
    }

    setIsSavingManualGoal(true)
    setManualError('')

    try {
      let category = manualCategory.trim()

      if (!category) {
        const data = await fetchAnthropicJson<InferCategoryResponse>({
          system:
            'Given a goal title, return a single category label. Return ONLY valid JSON: { "category": string }',
          maxTokens: 150,
          message: title,
        })

        category = data.category.trim()
      }

      if (!category) {
        throw new Error('Missing category')
      }

      addGoal({
        id: createId('goal'),
        title,
        category,
        categoryColor: getCategoryColor(category),
        seasonKey: null,
        milestones: [],
        createdFrom: 'manual',
        expanded: true,
      })

      resetManualForm()
    } catch {
      setManualError(
        'Could not save this goal right now — add a category or try again'
      )
    } finally {
      setIsSavingManualGoal(false)
    }
  }

  const handlePlanYear = async () => {
    if (goals.length === 0) {
      return
    }

    setIsPlanningYear(true)
    setPlanError('')

    try {
      const data = await fetchAnthropicJson<SeasonPlanResponse>({
        system:
          'You are an annual planning assistant. Given a list of goals and 4 seasons (Spring Jan-Mar, Summer Apr-Jun, Fall Jul-Sep, Winter Oct-Dec), assign each goal to the most appropriate season based on natural timing, momentum, and dependencies. Consider that Spring is for building foundations, Summer for peak effort, Fall for harvesting results, Winter for reflection. Return ONLY valid JSON: { "plan": [{ "goalId": string, "seasonKey": "spring"|"summer"|"fall"|"winter", "reason": string }] }',
        maxTokens: 1000,
        message: JSON.stringify(
          goals.map((goal) => ({
            id: goal.id,
            title: goal.title,
            category: goal.category,
          }))
        ),
      })

      const nextPlan = data.plan.filter((item) =>
        goals.some((goal) => goal.id === item.goalId)
      )

      setSeasonPlan(nextPlan)
      setApprovedPlanGoals(
        Object.fromEntries(nextPlan.map((item) => [item.goalId, true]))
      )
    } catch {
      setPlanError('Could not plan your year right now — try again')
    } finally {
      setIsPlanningYear(false)
    }
  }

  const handleApplyPlan = () => {
    visiblePlan.forEach((item) => {
      if (!approvedPlanGoals[item.goalId]) {
        return
      }

      const goal = goals.find((entry) => entry.id === item.goalId)

      if (!goal) {
        return
      }

      updateGoal(goal.id, { seasonKey: item.seasonKey })

      goal.milestones.forEach((milestone) => {
        assignMilestoneToSeason(goal.id, milestone.id, item.seasonKey)
      })
    })
  }

  return (
    <div className="mx-auto flex w-full max-w-[680px] flex-col gap-6">
      <section
        className="rounded-[24px] p-6 transition-all duration-200"
        style={CARD_STYLES}
      >
        <div className="flex flex-col gap-2">
          <h1 className="text-[1.85rem] font-black leading-tight" style={{ color: '#F0EFEB' }}>
            Describe your year as if it&apos;s already happened
          </h1>
          <p className="text-sm leading-relaxed" style={{ color: 'rgba(255,255,255,0.36)' }}>
            Write in past tense. Be specific — what did you do, feel, build,
            experience?
          </p>
        </div>

        <textarea
          value={yearDescription}
          onChange={(event) => {
            setYearDescription(event.target.value)
            setGenerationError('')
          }}
          placeholder="It&apos;s December 31st. You&apos;re reflecting on an incredible year. You finally got consistent at the gym. You launched that project. You took the family trip you kept postponing. Write it all out — big and small..."
          className="mt-5 w-full resize-none rounded-[20px] px-4 py-4 text-sm font-semibold outline-none transition-all duration-200 focus:border-white/20"
          style={{ ...INPUT_STYLES, minHeight: 160 }}
        />

        <div className="mt-4 flex flex-col gap-3 sm:flex-row">
          <button
            onClick={handleGenerateGoals}
            disabled={!yearDescription.trim() || isGeneratingGoals}
            className="flex flex-1 items-center justify-center gap-2 rounded-[16px] px-4 py-3 text-sm font-black transition-all duration-200 disabled:cursor-not-allowed"
            style={{
              background:
                !yearDescription.trim() || isGeneratingGoals
                  ? 'rgba(170,223,79,0.3)'
                  : '#AADF4F',
              color:
                !yearDescription.trim() || isGeneratingGoals
                  ? 'rgba(15,15,15,0.55)'
                  : '#0F0F0F',
              opacity: !yearDescription.trim() ? 0.65 : 1,
            }}
          >
            {isGeneratingGoals && <Loader2 size={16} className="animate-spin" />}
            {isGeneratingGoals ? 'Generating your goals...' : 'Generate my goals →'}
          </button>

          <button
            onClick={() => {
              setShowManualForm((current) => !current)
              setManualError('')
            }}
            className="rounded-[16px] px-4 py-3 text-sm font-black transition-all duration-200 sm:flex-shrink-0"
            style={{
              background: 'transparent',
              border: '1px solid rgba(255,255,255,0.12)',
              color: 'rgba(255,255,255,0.5)',
            }}
          >
            Add a goal myself
          </button>
        </div>

        {generationError && (
          <div className="mt-4 rounded-[16px] px-4 py-3 text-sm" style={ERROR_BANNER_STYLES}>
            {generationError}
          </div>
        )}

        {goals.length > 0 && (
          <div className="mt-4">
            <button
              onClick={handlePlanYear}
              disabled={isPlanningYear}
              className="flex w-full items-center justify-center gap-2 rounded-[16px] px-4 py-3 text-sm font-black transition-all duration-200 disabled:cursor-not-allowed"
              style={{
                background: 'rgba(168,158,245,0.1)',
                border: '1px solid rgba(168,158,245,0.3)',
                color: '#A89EF5',
                opacity: isPlanningYear ? 0.8 : 1,
              }}
            >
              {isPlanningYear && <Loader2 size={16} className="animate-spin" />}
              {isPlanningYear ? 'Planning your year...' : 'Plan my year with AI →'}
            </button>

            {planError && (
              <div className="mt-3 rounded-[16px] px-4 py-3 text-sm" style={ERROR_BANNER_STYLES}>
                {planError}
              </div>
            )}
          </div>
        )}
      </section>

      {goals.length > 0 && (
        <section className="flex flex-col gap-3">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-xl font-black" style={{ color: '#F0EFEB' }}>
              Your goals this year
            </h2>
            <span
              className="rounded-full px-3 py-1 text-xs font-black"
              style={{
                background: 'rgba(170,223,79,0.12)',
                border: '1px solid rgba(170,223,79,0.2)',
                color: '#AADF4F',
              }}
            >
              {goals.length} {goals.length === 1 ? 'goal' : 'goals'}
            </span>
          </div>

          {goals.map((goal) => {
            const suggestionPanel = suggestionPanels[goal.id]
            const selectedSuggestionCount =
              suggestionPanel?.suggestions.filter((suggestion) => suggestion.selected).length ?? 0
            const seasonBadge = getSeasonBadge(goal.seasonKey)

            return (
              <article
                key={goal.id}
                className="rounded-[24px] p-5 transition-all duration-200"
                style={{
                  ...CARD_STYLES,
                  border: goal.expanded
                    ? `1px solid ${goal.categoryColor}59`
                    : CARD_STYLES.border,
                }}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <span
                      className="inline-flex rounded-full px-3 py-1 text-xs font-extrabold"
                      style={{
                        background: `${goal.categoryColor}1F`,
                        color: goal.categoryColor,
                      }}
                    >
                      {goal.category}
                    </span>

                    {editingGoalId === goal.id ? (
                      <input
                        value={editingGoalTitle}
                        onChange={(event) => setEditingGoalTitle(event.target.value)}
                        onBlur={handleSaveGoalTitle}
                        onKeyDown={(event) => {
                          if (event.key === 'Enter') {
                            handleSaveGoalTitle()
                          }

                          if (event.key === 'Escape') {
                            setEditingGoalId(null)
                            setEditingGoalTitle('')
                          }
                        }}
                        autoFocus
                        className="mt-2 w-full rounded-[14px] px-3 py-2 text-base font-black outline-none transition-all duration-200 focus:border-white/20"
                        style={INPUT_STYLES}
                      />
                    ) : (
                      <p className="mt-2 text-base font-black" style={{ color: '#F0EFEB' }}>
                        {goal.title}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-1.5">
                    {seasonBadge && (
                      <span
                        className="rounded-full px-2.5 py-1 text-[11px] font-black"
                        style={{
                          background: `${seasonBadge.color}1A`,
                          color: seasonBadge.color,
                        }}
                      >
                        {seasonBadge.label}
                      </span>
                    )}

                    <button
                      onClick={() => handleStartGoalEdit(goal)}
                      className="rounded-full p-2 transition-all duration-200 hover:bg-[#202020]"
                      style={{ color: 'rgba(255,255,255,0.45)' }}
                      aria-label={`Edit ${goal.title}`}
                    >
                      <Edit2 size={15} />
                    </button>

                    <button
                      onClick={() => {
                        if (confirmingDeleteGoalId === goal.id) {
                          removeGoal(goal.id)
                          setConfirmingDeleteGoalId(null)
                          return
                        }

                        setConfirmingDeleteGoalId(goal.id)
                      }}
                      className="rounded-full p-2 transition-all duration-200"
                      style={{
                        background:
                          confirmingDeleteGoalId === goal.id
                            ? 'rgba(240,115,154,0.14)'
                            : 'transparent',
                        color:
                          confirmingDeleteGoalId === goal.id
                            ? '#F0739A'
                            : 'rgba(255,255,255,0.45)',
                      }}
                      aria-label={`Delete ${goal.title}`}
                    >
                      <Trash2 size={15} />
                    </button>

                    <button
                      onClick={() => toggleGoalExpanded(goal.id)}
                      className="rounded-full p-2 transition-all duration-200 hover:bg-[#202020]"
                      style={{ color: goal.expanded ? goal.categoryColor : 'rgba(255,255,255,0.45)' }}
                      aria-label={goal.expanded ? 'Collapse goal' : 'Expand goal'}
                    >
                      {goal.expanded ? <ChevronUp size={17} /> : <ChevronDown size={17} />}
                    </button>
                  </div>
                </div>

                {goal.expanded && (
                  <div className="mt-4 flex flex-col gap-4">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <span className="text-sm font-bold" style={{ color: 'rgba(255,255,255,0.45)' }}>
                        {goal.milestones.length}{' '}
                        {goal.milestones.length === 1 ? 'milestone' : 'milestones'}
                      </span>

                      <button
                        onClick={() => handleSuggestMilestones(goal)}
                        disabled={suggestingGoalId === goal.id}
                        className="inline-flex items-center gap-2 self-start rounded-full px-3 py-2 text-xs font-black transition-all duration-200 disabled:cursor-not-allowed"
                        style={{
                          background: 'rgba(168,158,245,0.12)',
                          color: '#A89EF5',
                          opacity: suggestingGoalId === goal.id ? 0.75 : 1,
                        }}
                      >
                        {suggestingGoalId === goal.id ? (
                          <Loader2 size={14} className="animate-spin" />
                        ) : (
                          <Zap size={14} />
                        )}
                        Suggest with AI
                      </button>
                    </div>

                    {suggestionErrors[goal.id] && (
                      <div className="rounded-[16px] px-4 py-3 text-sm" style={ERROR_BANNER_STYLES}>
                        {suggestionErrors[goal.id]}
                      </div>
                    )}

                    {(suggestingGoalId === goal.id || suggestionPanel?.visible) && (
                      <div
                        className="rounded-[20px] p-4"
                        style={{
                          background: '#202020',
                          border: '1px solid rgba(168,158,245,0.2)',
                        }}
                      >
                        <div className="flex items-center justify-between gap-3">
                          <p className="text-sm font-bold" style={{ color: 'rgba(255,255,255,0.5)' }}>
                            AI suggested these milestones
                          </p>

                          <button
                            onClick={() =>
                              setSuggestionPanels((current) => {
                                const nextPanels = { ...current }
                                delete nextPanels[goal.id]
                                return nextPanels
                              })
                            }
                            className="rounded-full p-1 transition-all duration-200 hover:bg-[#181818]"
                            style={{ color: 'rgba(255,255,255,0.45)' }}
                            aria-label="Dismiss suggestions"
                          >
                            <X size={14} />
                          </button>
                        </div>

                        {suggestingGoalId === goal.id && (!suggestionPanel || suggestionPanel.suggestions.length === 0) ? (
                          <div className="mt-4 flex items-center gap-2 text-sm" style={{ color: '#A89EF5' }}>
                            <Loader2 size={15} className="animate-spin" />
                            Thinking through the right milestones...
                          </div>
                        ) : (
                          <>
                            <div className="mt-4 flex flex-col gap-2.5">
                              {suggestionPanel?.suggestions.map((suggestion) => (
                                <div key={suggestion.id} className="flex items-center gap-3">
                                  <input
                                    type="checkbox"
                                    checked={suggestion.selected}
                                    onChange={(event) =>
                                      setSuggestionPanels((current) => ({
                                        ...current,
                                        [goal.id]: {
                                          ...current[goal.id],
                                          suggestions: current[goal.id].suggestions.map((entry) =>
                                            entry.id === suggestion.id
                                              ? {
                                                  ...entry,
                                                  selected: event.target.checked,
                                                }
                                              : entry
                                          ),
                                        },
                                      }))
                                    }
                                    className="h-4 w-4 cursor-pointer rounded"
                                    style={{ accentColor: '#AADF4F' }}
                                  />

                                  <input
                                    value={suggestion.title}
                                    onChange={(event) =>
                                      setSuggestionPanels((current) => ({
                                        ...current,
                                        [goal.id]: {
                                          ...current[goal.id],
                                          suggestions: current[goal.id].suggestions.map((entry) =>
                                            entry.id === suggestion.id
                                              ? {
                                                  ...entry,
                                                  title: event.target.value,
                                                }
                                              : entry
                                          ),
                                        },
                                      }))
                                    }
                                    onFocus={() =>
                                      setSuggestionPanels((current) => ({
                                        ...current,
                                        [goal.id]: {
                                          ...current[goal.id],
                                          suggestions: current[goal.id].suggestions.map((entry) =>
                                            entry.id === suggestion.id
                                              ? { ...entry, editing: true }
                                              : entry
                                          ),
                                        },
                                      }))
                                    }
                                    onBlur={() =>
                                      setSuggestionPanels((current) => ({
                                        ...current,
                                        [goal.id]: {
                                          ...current[goal.id],
                                          suggestions: current[goal.id].suggestions.map((entry) =>
                                            entry.id === suggestion.id
                                              ? { ...entry, editing: false }
                                              : entry
                                          ),
                                        },
                                      }))
                                    }
                                    className="w-full rounded-[14px] px-3 py-2 text-sm outline-none transition-all duration-200 focus:border-white/20"
                                    style={{
                                      ...INPUT_STYLES,
                                      border: suggestion.editing
                                        ? '1px solid rgba(255,255,255,0.2)'
                                        : INPUT_STYLES.border,
                                    }}
                                  />
                                </div>
                              ))}
                            </div>

                            <div className="mt-4 flex flex-col gap-2 sm:flex-row">
                              <button
                                onClick={() => handleApplySuggestions(goal)}
                                disabled={selectedSuggestionCount === 0}
                                className="flex-1 rounded-[14px] px-4 py-3 text-sm font-black transition-all duration-200 disabled:cursor-not-allowed"
                                style={{
                                  background:
                                    selectedSuggestionCount === 0
                                      ? 'rgba(170,223,79,0.18)'
                                      : '#AADF4F',
                                  color:
                                    selectedSuggestionCount === 0
                                      ? 'rgba(15,15,15,0.55)'
                                      : '#0F0F0F',
                                  opacity: selectedSuggestionCount === 0 ? 0.7 : 1,
                                }}
                              >
                                Apply selected
                              </button>

                              <button
                                onClick={() =>
                                  setSuggestionPanels((current) => {
                                    const nextPanels = { ...current }
                                    delete nextPanels[goal.id]
                                    return nextPanels
                                  })
                                }
                                className="rounded-[14px] px-4 py-3 text-sm font-black transition-all duration-200"
                                style={{
                                  background: 'transparent',
                                  border: '1px solid rgba(255,255,255,0.12)',
                                  color: 'rgba(255,255,255,0.5)',
                                }}
                              >
                                Discard all
                              </button>
                            </div>
                          </>
                        )}
                      </div>
                    )}

                    {goal.milestones.length > 0 ? (
                      <div
                        className="overflow-hidden rounded-[18px]"
                        style={{ border: '1px solid rgba(255,255,255,0.05)' }}
                      >
                        {goal.milestones.map((milestone, index) => (
                          <div
                            key={milestone.id}
                            className="flex flex-col gap-3 px-4 py-3 md:flex-row md:items-center"
                            style={{
                              background: '#181818',
                              borderTop:
                                index === 0
                                  ? 'none'
                                  : '1px solid rgba(255,255,255,0.05)',
                            }}
                          >
                            <div className="flex min-w-0 flex-1 items-center gap-3">
                              <span
                                className="h-2.5 w-2.5 flex-shrink-0 rounded-full"
                                style={{
                                  background: getMilestoneStatusColor(milestone.status),
                                }}
                              />

                              {editingMilestone?.milestoneId === milestone.id ? (
                                <input
                                  value={editingMilestone.title}
                                  onChange={(event) =>
                                    setEditingMilestone((current) =>
                                      current
                                        ? { ...current, title: event.target.value }
                                        : current
                                    )
                                  }
                                  onBlur={() => {
                                    const nextTitle = editingMilestone.title.trim()

                                    if (nextTitle) {
                                      updateGoalMilestone(
                                        editingMilestone.goalId,
                                        editingMilestone.milestoneId,
                                        nextTitle
                                      )
                                    }

                                    setEditingMilestone(null)
                                  }}
                                  onKeyDown={(event) => {
                                    if (event.key === 'Enter') {
                                      const nextTitle = editingMilestone.title.trim()

                                      if (nextTitle) {
                                        updateGoalMilestone(
                                          editingMilestone.goalId,
                                          editingMilestone.milestoneId,
                                          nextTitle
                                        )
                                      }

                                      setEditingMilestone(null)
                                    }

                                    if (event.key === 'Escape') {
                                      setEditingMilestone(null)
                                    }
                                  }}
                                  autoFocus
                                  className="w-full rounded-[14px] px-3 py-2 text-sm outline-none transition-all duration-200 focus:border-white/20"
                                  style={INPUT_STYLES}
                                />
                              ) : (
                                <p className="min-w-0 text-sm" style={{ color: '#F0EFEB' }}>
                                  {milestone.title}
                                </p>
                              )}
                            </div>

                            <div className="flex flex-wrap items-center gap-2 md:justify-end">
                              <select
                                value={milestone.seasonKey ?? ''}
                                onChange={(event) => {
                                  const value = event.target.value as SeasonKey | ''

                                  if (!value) {
                                    return
                                  }

                                  assignMilestoneToSeason(goal.id, milestone.id, value)
                                }}
                                className="rounded-full px-3 py-2 text-xs font-bold outline-none transition-all duration-200 focus:border-white/20"
                                style={INPUT_STYLES}
                              >
                                <option value="">Assign to season</option>
                                {SEASON_ORDER.map((seasonKey) => (
                                  <option key={seasonKey} value={seasonKey}>
                                    {SEASONS[seasonKey].label}
                                  </option>
                                ))}
                              </select>

                              <button
                                onClick={() =>
                                  setEditingMilestone({
                                    goalId: goal.id,
                                    milestoneId: milestone.id,
                                    title: milestone.title,
                                  })
                                }
                                className="rounded-full p-2 transition-all duration-200 hover:bg-[#202020]"
                                style={{ color: 'rgba(255,255,255,0.45)' }}
                                aria-label={`Edit ${milestone.title}`}
                              >
                                <Edit2 size={14} />
                              </button>

                              <button
                                onClick={() => removeGoalMilestone(goal.id, milestone.id)}
                                className="rounded-full p-2 transition-all duration-200 hover:bg-[#202020]"
                                style={{ color: 'rgba(255,255,255,0.45)' }}
                                aria-label={`Delete ${milestone.title}`}
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p
                        className="text-xs italic"
                        style={{ color: 'rgba(255,255,255,0.32)' }}
                      >
                        No milestones yet — add one or let AI suggest some
                      </p>
                    )}

                    <div className="flex gap-2">
                      <input
                        value={newMilestoneTitles[goal.id] ?? ''}
                        onChange={(event) =>
                          setNewMilestoneTitles((current) => ({
                            ...current,
                            [goal.id]: event.target.value,
                          }))
                        }
                        onKeyDown={(event) => {
                          if (event.key === 'Enter') {
                            handleAddMilestone(goal)
                          }
                        }}
                        placeholder="Add a milestone..."
                        className="w-full rounded-[16px] px-4 py-3 text-sm outline-none transition-all duration-200 focus:border-white/20"
                        style={INPUT_STYLES}
                      />

                      <button
                        onClick={() => handleAddMilestone(goal)}
                        className="flex h-[48px] w-[48px] items-center justify-center rounded-[16px] transition-all duration-200"
                        style={{
                          background: '#202020',
                          border: '1px solid rgba(255,255,255,0.07)',
                          color: '#AADF4F',
                        }}
                        aria-label="Save milestone"
                      >
                        <Plus size={18} />
                      </button>
                    </div>
                  </div>
                )}
              </article>
            )
          })}
        </section>
      )}

      {visiblePlan.length > 0 && (
        <section
          className="rounded-[24px] p-6 transition-all duration-200"
          style={CARD_STYLES}
        >
          <div>
            <h2 className="text-xl font-black" style={{ color: '#F0EFEB' }}>
              Plan my year result
            </h2>
            <p className="mt-1 text-sm" style={{ color: 'rgba(255,255,255,0.36)' }}>
              Review each season, keep the assignments you like, then apply the plan.
            </p>
          </div>

          <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-4">
            {SEASON_ORDER.map((seasonKey) => {
              const season = SEASONS[seasonKey]
              const seasonItems = visiblePlan.filter((item) => item.seasonKey === seasonKey)

              return (
                <div
                  key={seasonKey}
                  className="rounded-[20px] p-4"
                  style={{
                    background: '#202020',
                    border: `1px solid ${season.color}26`,
                  }}
                >
                  <div className="flex items-center gap-2">
                    <span style={{ fontSize: 18 }}>{season.emoji}</span>
                    <div>
                      <p className="text-sm font-black" style={{ color: season.color }}>
                        {season.label}
                      </p>
                      <p className="text-[11px]" style={{ color: 'rgba(255,255,255,0.28)' }}>
                        {season.dateRange}
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 flex flex-col gap-2.5">
                    {seasonItems.length === 0 ? (
                      <p className="text-xs italic" style={{ color: 'rgba(255,255,255,0.28)' }}>
                        No goals assigned here
                      </p>
                    ) : (
                      seasonItems.map((item) => {
                        const goal = goals.find((entry) => entry.id === item.goalId)

                        if (!goal) {
                          return null
                        }

                        const approved = approvedPlanGoals[item.goalId]

                        return (
                          <button
                            key={item.goalId}
                            onClick={() =>
                              setApprovedPlanGoals((current) => ({
                                ...current,
                                [item.goalId]: !current[item.goalId],
                              }))
                            }
                            className="rounded-[16px] px-3 py-3 text-left transition-all duration-200"
                            style={{
                              background: approved
                                ? `${season.color}18`
                                : 'rgba(255,255,255,0.03)',
                              border: `1px solid ${approved ? `${season.color}40` : 'rgba(255,255,255,0.06)'}`,
                            }}
                          >
                            <div className="flex items-start gap-3">
                              <span
                                className="mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full"
                                style={{
                                  background: approved ? season.color : 'transparent',
                                  border: `1px solid ${approved ? season.color : 'rgba(255,255,255,0.16)'}`,
                                  color: approved ? '#0F0F0F' : 'transparent',
                                }}
                              >
                                <Check size={12} />
                              </span>

                              <div className="min-w-0">
                                <p className="text-sm font-black" style={{ color: '#F0EFEB' }}>
                                  {goal.title}
                                </p>
                                <p className="mt-1 text-[11px] leading-relaxed" style={{ color: 'rgba(255,255,255,0.36)' }}>
                                  {item.reason}
                                </p>
                              </div>
                            </div>
                          </button>
                        )
                      })
                    )}
                  </div>
                </div>
              )
            })}
          </div>

          <div className="mt-5 flex flex-col gap-2 sm:flex-row">
            <button
              onClick={handleApplyPlan}
              disabled={approvedPlanCount === 0}
              className="flex-1 rounded-[16px] px-4 py-3 text-sm font-black transition-all duration-200 disabled:cursor-not-allowed"
              style={{
                background:
                  approvedPlanCount === 0 ? 'rgba(170,223,79,0.18)' : '#AADF4F',
                color:
                  approvedPlanCount === 0 ? 'rgba(15,15,15,0.55)' : '#0F0F0F',
                opacity: approvedPlanCount === 0 ? 0.7 : 1,
              }}
            >
              Apply this plan
            </button>

            <button
              onClick={handlePlanYear}
              disabled={isPlanningYear}
              className="rounded-[16px] px-4 py-3 text-sm font-black transition-all duration-200 disabled:cursor-not-allowed"
              style={{
                background: 'transparent',
                border: '1px solid rgba(255,255,255,0.12)',
                color: 'rgba(255,255,255,0.5)',
              }}
            >
              Redo plan
            </button>
          </div>
        </section>
      )}

      {showManualForm && (
        <section
          className="rounded-[24px] p-5 transition-all duration-200"
          style={{
            background: '#181818',
            border: '1px solid rgba(255,255,255,0.1)',
          }}
        >
          <div className="flex flex-col gap-4">
            <div>
              <label className="text-sm font-black" style={{ color: '#F0EFEB' }}>
                What is the goal?
              </label>
              <input
                value={manualTitle}
                onChange={(event) => {
                  setManualTitle(event.target.value)
                  setManualError('')
                }}
                placeholder="Write the goal you want to pursue this year"
                className="mt-2 w-full rounded-[16px] px-4 py-3 text-sm outline-none transition-all duration-200 focus:border-white/20"
                style={INPUT_STYLES}
              />
            </div>

            <div>
              <label className="text-sm font-black" style={{ color: '#F0EFEB' }}>
                Category
              </label>
              <p className="mt-1 text-xs" style={{ color: 'rgba(255,255,255,0.36)' }}>
                (e.g. Health, Career, Family — AI will suggest if you leave this
                blank)
              </p>
              <input
                value={manualCategory}
                onChange={(event) => {
                  setManualCategory(event.target.value)
                  setManualError('')
                }}
                placeholder="Category"
                className="mt-2 w-full rounded-[16px] px-4 py-3 text-sm outline-none transition-all duration-200 focus:border-white/20"
                style={INPUT_STYLES}
              />
            </div>

            {manualError && (
              <div className="rounded-[16px] px-4 py-3 text-sm" style={ERROR_BANNER_STYLES}>
                {manualError}
              </div>
            )}

            <div className="flex items-center gap-4">
              <button
                onClick={handleSaveManualGoal}
                disabled={!manualTitle.trim() || isSavingManualGoal}
                className="rounded-[16px] px-4 py-3 text-sm font-black transition-all duration-200 disabled:cursor-not-allowed"
                style={{
                  background:
                    !manualTitle.trim() || isSavingManualGoal
                      ? 'rgba(170,223,79,0.18)'
                      : '#AADF4F',
                  color:
                    !manualTitle.trim() || isSavingManualGoal
                      ? 'rgba(15,15,15,0.55)'
                      : '#0F0F0F',
                  opacity: !manualTitle.trim() ? 0.7 : 1,
                }}
              >
                <span className="inline-flex items-center gap-2">
                  {isSavingManualGoal && (
                    <Loader2 size={16} className="animate-spin" />
                  )}
                  Save goal
                </span>
              </button>

              <button
                onClick={resetManualForm}
                className="text-sm font-bold transition-all duration-200"
                style={{ color: 'rgba(255,255,255,0.4)' }}
              >
                Cancel
              </button>
            </div>
          </div>
        </section>
      )}
    </div>
  )
}
