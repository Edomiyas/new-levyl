import { useState } from 'react'
import {
  Check,
  ChevronDown,
  ChevronUp,
  Edit2,
  Loader2,
  Plus,
  Trash2,
} from 'lucide-react'
import { getCategoryColor, SEASONS, SEASON_ORDER } from '../lib/constants'
import { useAppStore } from '../store/appStore'
import type { Goal, GoalMilestone, SeasonKey } from '../types'

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

interface InferCategoryResponse {
  category: string
}

interface CoachingQuestionsResponse {
  questions: string[]
}

interface PersonalizedMilestonesResponse {
  milestones: Array<{ title: string; description: string }>
}

interface SeasonPlanItem {
  goalId: string
  seasonKey: SeasonKey
  reason: string
}

interface SeasonPlanResponse {
  plan: SeasonPlanItem[]
}

type CoachingPhase =
  | 'idle'
  | 'questionsLoading'
  | 'questionsReady'
  | 'answering'
  | 'milestonesLoading'
  | 'reviewing'
  | 'saved'

interface DraftMilestone {
  id: string
  title: string
  description: string
}

interface GoalCoachingState {
  phase: CoachingPhase
  questions: string[]
  answers: string[]
  draftMilestones: DraftMilestone[]
  skippedQuestions: boolean
  error: string
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

function createEmptyCoachingState(): GoalCoachingState {
  return {
    phase: 'idle',
    questions: [],
    answers: ['', '', ''],
    draftMilestones: [],
    skippedQuestions: false,
    error: '',
  }
}

function getAnthropicApiKey() {
  return import.meta.env.VITE_ANTHROPIC_API_KEY?.trim()
}

function extractAnthropicText(response: AnthropicResponse) {
  const text = response.content
    ?.filter(
      (block): block is { type: 'text'; text: string } => block.type === 'text'
    )
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
      'anthropic-dangerous-direct-browser-access': 'true',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-20250514',
      max_tokens: maxTokens,
      system,
      messages: [{ role: 'user', content: message }],
    }),
  })

  if (!response.ok) {
    const errorText = await response.text()
    let parsedMessage = ''

    try {
      const parsed = JSON.parse(errorText) as {
        error?: { message?: string }
      }

      parsedMessage = parsed.error?.message?.trim() || ''
    } catch {
      parsedMessage = ''
    }

    if (parsedMessage === 'invalid x-api-key') {
      throw new Error(
        'Invalid Anthropic API key. Update VITE_ANTHROPIC_API_KEY in .env.local and restart the dev server.'
      )
    }

    throw new Error(parsedMessage || errorText)
  }

  const data = (await response.json()) as AnthropicResponse

  return JSON.parse(extractAnthropicText(data)) as T
}

function autoResizeTextarea(element: HTMLTextAreaElement) {
  element.style.height = '0px'
  element.style.height = `${element.scrollHeight}px`
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
  const [editingCategoryGoalId, setEditingCategoryGoalId] = useState<string | null>(
    null
  )
  const [editingCategoryText, setEditingCategoryText] = useState('')
  const [confirmingDeleteGoalId, setConfirmingDeleteGoalId] = useState<string | null>(
    null
  )
  const [editingMilestone, setEditingMilestone] = useState<{
    goalId: string
    milestoneId: string
    title: string
    description: string
  } | null>(null)
  const [coachingStates, setCoachingStates] = useState<
    Record<string, GoalCoachingState>
  >({})
  const [seasonPlan, setSeasonPlan] = useState<SeasonPlanItem[] | null>(null)
  const [approvedPlanGoals, setApprovedPlanGoals] = useState<Record<string, boolean>>(
    {}
  )
  const [isPlanningYear, setIsPlanningYear] = useState(false)
  const [planError, setPlanError] = useState('')

  const visiblePlan =
    seasonPlan?.filter((item) => goals.some((goal) => goal.id === item.goalId)) ??
    []

  const approvedPlanCount = visiblePlan.filter(
    (item) => approvedPlanGoals[item.goalId]
  ).length

  const setCoachingState = (
    goalId: string,
    updater: (state: GoalCoachingState) => GoalCoachingState
  ) => {
    setCoachingStates((current) => ({
      ...current,
      [goalId]: updater(current[goalId] ?? createEmptyCoachingState()),
    }))
  }

  const resetManualForm = () => {
    setManualTitle('')
    setManualCategory('')
    setManualError('')
    setShowManualForm(false)
  }

  const saveGoalTitle = () => {
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

  const saveGoalCategory = () => {
    if (!editingCategoryGoalId) {
      return
    }

    const nextCategory = editingCategoryText.trim()

    if (nextCategory) {
      updateGoal(editingCategoryGoalId, {
        category: nextCategory,
        categoryColor: getCategoryColor(nextCategory),
      })
    }

    setEditingCategoryGoalId(null)
    setEditingCategoryText('')
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
          'You are a goal extraction assistant. The user wrote their ideal year in past tense. Extract 4-7 specific meaningful goals. For each goal infer a category from the domain it belongs to — Health & Fitness, Financial, Family, Career, Relationships, Learning, Spiritual, Creative, Travel, or Community. Only use categories genuinely present in the text. Return ONLY valid JSON, no markdown: { "goals": [{ "title": string, "category": string }] }',
        maxTokens: 1000,
        message: yearDescription,
      })

      const seen = new Set(
        goals.map(
          (goal) =>
            `${goal.title.toLowerCase().trim()}::${goal.category.toLowerCase().trim()}`
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
    } catch (error) {
      setGenerationError(
        error instanceof Error
          ? error.message
          : 'Could not generate goals — try again or add manually'
      )
    } finally {
      setIsGeneratingGoals(false)
    }
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
            'Given a goal title, choose the single best category from Health & Fitness, Financial, Family, Career, Relationships, Learning, Spiritual, Creative, Travel, or Community. Return ONLY valid JSON: { "category": string }',
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
    } catch (error) {
      setManualError(
        error instanceof Error
          ? error.message
          : 'Could not save this goal right now — add a category or try again'
      )
    } finally {
      setIsSavingManualGoal(false)
    }
  }

  const handleAddMilestone = (goalId: string) => {
    const title = newMilestoneTitles[goalId]?.trim()

    if (!title) {
      return
    }

    addGoalMilestone(goalId, {
      id: createId('goal-milestone'),
      goalId,
      title,
      description: '',
      status: 'not_started',
      seasonKey: null,
    })

    setNewMilestoneTitles((current) => ({ ...current, [goalId]: '' }))
  }

  const handleGetCoachingQuestions = async (goal: Goal) => {
    if (!goal.expanded) {
      toggleGoalExpanded(goal.id)
    }

    setCoachingState(goal.id, () => ({
      phase: 'questionsLoading',
      questions: [],
      answers: ['', '', ''],
      draftMilestones: [],
      skippedQuestions: false,
      error: '',
    }))

    try {
      const data = await fetchAnthropicJson<CoachingQuestionsResponse>({
        system:
          "You are a professional coach and expert in the domain of the goal. Generate exactly 3 short, specific diagnostic questions to understand:\n1. The user's current situation or starting point\n2. What success specifically looks like for them\n3. Any constraints (time, money, health, resources, experience level)\n\nThe questions must be specific to the goal category and feel like they come from a real professional in that field — not generic. A fitness coach asks differently than a financial advisor. Keep each question under 15 words. Return ONLY valid JSON: { \"questions\": [string, string, string] }",
        maxTokens: 600,
        message: `Goal: ${goal.title}\nCategory: ${goal.category}\nUser's vision: ${yearDescription}`,
      })

      const questions = data.questions.map((question) => question.trim()).filter(Boolean)

      if (questions.length !== 3) {
        throw new Error('Could not prepare your coaching questions right now')
      }

      setCoachingState(goal.id, () => ({
        phase: 'questionsReady',
        questions,
        answers: ['', '', ''],
        draftMilestones: [],
        skippedQuestions: false,
        error: '',
      }))
    } catch (error) {
      setCoachingState(goal.id, () => ({
        phase: 'idle',
        questions: [],
        answers: ['', '', ''],
        draftMilestones: [],
        skippedQuestions: false,
        error:
          error instanceof Error
            ? error.message
            : 'Could not prepare your coaching questions right now',
      }))
    }
  }

  const handleCoachingAnswerChange = (
    goalId: string,
    index: number,
    value: string,
    element: HTMLTextAreaElement
  ) => {
    autoResizeTextarea(element)

    setCoachingState(goalId, (current) => {
      const nextAnswers = current.answers.map((answer, answerIndex) =>
        answerIndex === index ? value : answer
      )
      const phase = nextAnswers.some((answer) => answer.trim())
        ? 'answering'
        : 'questionsReady'

      return {
        ...current,
        answers: nextAnswers,
        phase,
        error: '',
      }
    })
  }

  const handleGeneratePersonalizedMilestones = async (
    goal: Goal,
    skippedQuestions: boolean
  ) => {
    const coachingState = coachingStates[goal.id] ?? createEmptyCoachingState()
    const allAnswered = coachingState.answers.every((answer) => answer.trim())

    if (!skippedQuestions && !allAnswered) {
      return
    }

    setCoachingState(goal.id, (current) => ({
      ...current,
      phase: 'milestonesLoading',
      skippedQuestions,
      error: '',
    }))

    const message = skippedQuestions
      ? `Goal: ${goal.title}
Category: ${goal.category}
Their vision: ${yearDescription}

The user skipped the diagnostic questions. Create a thoughtful first pass that stays generic but useful.

Question 1: ${coachingState.questions[0] ?? 'Current situation'}
Answer: Skipped by user

Question 2: ${coachingState.questions[1] ?? 'Definition of success'}
Answer: Skipped by user

Question 3: ${coachingState.questions[2] ?? 'Constraints'}
Answer: Skipped by user`
      : `Goal: ${goal.title}
Category: ${goal.category}
Their vision: ${yearDescription}

Question 1: ${coachingState.questions[0]}
Answer: ${coachingState.answers[0]}

Question 2: ${coachingState.questions[1]}
Answer: ${coachingState.answers[1]}

Question 3: ${coachingState.questions[2]}
Answer: ${coachingState.answers[2]}`

    try {
      const data = await fetchAnthropicJson<PersonalizedMilestonesResponse>({
        system: `You are a professional coach and domain expert in ${goal.category}. 

Based on the user's goal, their current situation, what success looks like to them, and their constraints — generate 3-5 highly personalized milestones.

Rules for milestones:
- Each milestone is a specific, concrete achievement — not a habit or task
- They must reflect the user's actual starting point (not generic)
- They must match the user's definition of success (not yours)
- They must be realistic given the constraints mentioned
- Use the language and framing of a real professional in this field
- Order them from foundational to advanced — each builds on the last
- Each milestone should have a short title (under 8 words) and a one-sentence description of what it means specifically for this user

Return ONLY valid JSON: { "milestones": [{ "title": string, "description": string }] }`,
        maxTokens: 1000,
        message,
      })

      const draftMilestones = data.milestones
        .map((milestone) => ({
          id: createId('draft-milestone'),
          title: milestone.title.trim(),
          description: milestone.description.trim(),
        }))
        .filter((milestone) => milestone.title && milestone.description)

      if (draftMilestones.length === 0) {
        throw new Error('Could not create milestones from that response')
      }

      setCoachingState(goal.id, (current) => ({
        ...current,
        phase: 'reviewing',
        draftMilestones,
        skippedQuestions,
        error: '',
      }))
    } catch (error) {
      setCoachingState(goal.id, (current) => ({
        ...current,
        phase: current.answers.some((answer) => answer.trim())
          ? 'answering'
          : 'questionsReady',
        error:
          error instanceof Error
            ? error.message
            : 'Could not create milestones right now',
      }))
    }
  }

  const handleSaveGeneratedMilestones = (goalId: string) => {
    const coachingState = coachingStates[goalId]

    if (!coachingState || coachingState.draftMilestones.length === 0) {
      return
    }

    coachingState.draftMilestones.forEach((milestone) => {
      addGoalMilestone(goalId, {
        id: createId('goal-milestone'),
        goalId,
        title: milestone.title.trim(),
        description: milestone.description.trim(),
        status: 'not_started',
        seasonKey: null,
      })
    })

    setCoachingState(goalId, (current) => ({
      ...current,
      phase: 'saved',
      draftMilestones: [],
      skippedQuestions: false,
      error: '',
    }))
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
    } catch (error) {
      setPlanError(
        error instanceof Error
          ? error.message
          : 'Could not plan your year right now — try again'
      )
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
          <h1
            className="text-[1.85rem] font-black leading-tight"
            style={{ color: '#F0EFEB' }}
          >
            Describe your year as if it&apos;s already happened
          </h1>
          <p
            className="text-sm leading-relaxed"
            style={{ color: 'rgba(255,255,255,0.36)' }}
          >
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
          <div
            className="mt-4 rounded-[16px] px-4 py-3 text-sm"
            style={ERROR_BANNER_STYLES}
          >
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
              <div
                className="mt-3 rounded-[16px] px-4 py-3 text-sm"
                style={ERROR_BANNER_STYLES}
              >
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
            const coachingState = coachingStates[goal.id] ?? createEmptyCoachingState()
            const hasCoachingPanel =
              goal.expanded &&
              !['idle', 'saved'].includes(coachingState.phase)
            const canCreateMilestones = coachingState.answers.every((answer) =>
              answer.trim()
            )

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
                    {editingCategoryGoalId === goal.id ? (
                      <input
                        value={editingCategoryText}
                        onChange={(event) => setEditingCategoryText(event.target.value)}
                        onBlur={saveGoalCategory}
                        onKeyDown={(event) => {
                          if (event.key === 'Enter') {
                            saveGoalCategory()
                          }

                          if (event.key === 'Escape') {
                            setEditingCategoryGoalId(null)
                            setEditingCategoryText('')
                          }
                        }}
                        autoFocus
                        className="inline-flex rounded-full px-3 py-1 text-xs font-extrabold outline-none transition-all duration-200 focus:border-white/20"
                        style={{
                          ...INPUT_STYLES,
                          width: 170,
                          color: goal.categoryColor,
                          background: `${goal.categoryColor}14`,
                          border: `1px solid ${goal.categoryColor}45`,
                        }}
                      />
                    ) : (
                      <button
                        onClick={() => {
                          setEditingCategoryGoalId(goal.id)
                          setEditingCategoryText(goal.category)
                        }}
                        className="inline-flex rounded-full px-3 py-1 text-xs font-extrabold transition-all duration-200"
                        style={{
                          background: `${goal.categoryColor}1F`,
                          color: goal.categoryColor,
                        }}
                      >
                        {goal.category}
                      </button>
                    )}

                    {editingGoalId === goal.id ? (
                      <input
                        value={editingGoalTitle}
                        onChange={(event) => setEditingGoalTitle(event.target.value)}
                        onBlur={saveGoalTitle}
                        onKeyDown={(event) => {
                          if (event.key === 'Enter') {
                            saveGoalTitle()
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
                    <button
                      onClick={() => {
                        setEditingGoalId(goal.id)
                        setEditingGoalTitle(goal.title)
                        setConfirmingDeleteGoalId(null)
                      }}
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
                      style={{
                        color: goal.expanded
                          ? goal.categoryColor
                          : 'rgba(255,255,255,0.45)',
                      }}
                      aria-label={goal.expanded ? 'Collapse goal' : 'Expand goal'}
                    >
                      {goal.expanded ? <ChevronUp size={17} /> : <ChevronDown size={17} />}
                    </button>
                  </div>
                </div>

                {goal.expanded && (
                  <div className="mt-4 flex flex-col gap-4">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <span
                        className="text-sm font-bold"
                        style={{ color: 'rgba(255,255,255,0.45)' }}
                      >
                        {goal.milestones.length}{' '}
                        {goal.milestones.length === 1 ? 'milestone' : 'milestones'}
                      </span>

                      <button
                        onClick={() => handleGetCoachingQuestions(goal)}
                        disabled={coachingState.phase === 'questionsLoading'}
                        className="inline-flex items-center gap-2 self-start rounded-full px-3 py-2 text-xs font-black transition-all duration-200 disabled:cursor-not-allowed"
                        style={{
                          background: 'rgba(168,158,245,0.12)',
                          color: '#A89EF5',
                          opacity: coachingState.phase === 'questionsLoading' ? 0.75 : 1,
                        }}
                      >
                        {coachingState.phase === 'questionsLoading' && (
                          <Loader2 size={14} className="animate-spin" />
                        )}
                        Get milestones
                      </button>
                    </div>

                    {coachingState.error && !hasCoachingPanel && (
                      <div
                        className="rounded-[16px] px-4 py-3 text-sm"
                        style={ERROR_BANNER_STYLES}
                      >
                        {coachingState.error}
                      </div>
                    )}

                    {hasCoachingPanel && (
                      <div
                        className="rounded-[16px] p-5"
                        style={{
                          background: '#202020',
                          border: '1px solid rgba(255,255,255,0.08)',
                          marginTop: 12,
                        }}
                      >
                        {coachingState.phase === 'questionsLoading' && (
                          <div
                            className="flex items-center gap-2 text-sm"
                            style={{ color: 'rgba(255,255,255,0.5)' }}
                          >
                            <Loader2 size={16} className="animate-spin" />
                            Preparing your questions...
                          </div>
                        )}

                        {(coachingState.phase === 'questionsReady' ||
                          coachingState.phase === 'answering' ||
                          coachingState.phase === 'milestonesLoading') && (
                          <div className="flex flex-col gap-4">
                            <p
                              className="text-sm"
                              style={{ color: 'rgba(255,255,255,0.5)' }}
                            >
                              To create milestones that actually fit your life, I
                              have a few questions.
                            </p>

                            {coachingState.error && (
                              <div
                                className="rounded-[14px] px-4 py-3 text-sm"
                                style={ERROR_BANNER_STYLES}
                              >
                                {coachingState.error}
                              </div>
                            )}

                            {coachingState.questions.map((question, index) => (
                              <div key={`${goal.id}-question-${index}`}>
                                <label
                                  className="mb-1.5 block text-[13px] font-extrabold"
                                  style={{ color: 'rgba(255,255,255,0.5)' }}
                                >
                                  {question}
                                </label>
                                <textarea
                                  rows={2}
                                  value={coachingState.answers[index] ?? ''}
                                  onChange={(event) =>
                                    handleCoachingAnswerChange(
                                      goal.id,
                                      index,
                                      event.target.value,
                                      event.currentTarget
                                    )
                                  }
                                  onInput={(event) =>
                                    autoResizeTextarea(event.currentTarget)
                                  }
                                  className="w-full resize-none overflow-hidden rounded-[10px] px-3 py-3 text-[14px] outline-none transition-all duration-200 focus:border-white/20"
                                  style={{
                                    background: '#181818',
                                    border: '1px solid rgba(255,255,255,0.07)',
                                    color: '#F0EFEB',
                                    fontFamily: 'Nunito, sans-serif',
                                  }}
                                />
                              </div>
                            ))}

                            <button
                              onClick={() =>
                                handleGeneratePersonalizedMilestones(goal, false)
                              }
                              disabled={
                                !canCreateMilestones ||
                                coachingState.phase === 'milestonesLoading'
                              }
                              className="rounded-[14px] px-4 py-3 text-sm font-black transition-all duration-200 disabled:cursor-not-allowed"
                              style={{
                                background:
                                  !canCreateMilestones ||
                                  coachingState.phase === 'milestonesLoading'
                                    ? 'rgba(170,223,79,0.18)'
                                    : '#AADF4F',
                                color:
                                  !canCreateMilestones ||
                                  coachingState.phase === 'milestonesLoading'
                                    ? 'rgba(15,15,15,0.55)'
                                    : '#0F0F0F',
                                opacity: !canCreateMilestones ? 0.7 : 1,
                              }}
                            >
                              <span className="inline-flex items-center gap-2">
                                {coachingState.phase === 'milestonesLoading' && (
                                  <Loader2 size={16} className="animate-spin" />
                                )}
                                Create my milestones →
                              </span>
                            </button>

                            <button
                              onClick={() =>
                                handleGeneratePersonalizedMilestones(goal, true)
                              }
                              disabled={coachingState.phase === 'milestonesLoading'}
                              className="self-start text-xs font-bold transition-all duration-200 disabled:cursor-not-allowed"
                              style={{ color: 'rgba(255,255,255,0.4)' }}
                            >
                              Skip questions — generate anyway
                            </button>
                          </div>
                        )}

                        {coachingState.phase === 'reviewing' && (
                          <div className="flex flex-col gap-4">
                            {coachingState.skippedQuestions && (
                              <div
                                className="rounded-[14px] px-4 py-3 text-sm"
                                style={{
                                  background: 'rgba(245,197,66,0.1)',
                                  border: '1px solid rgba(245,197,66,0.25)',
                                  color: '#F5C542',
                                }}
                              >
                                <span>
                                  These are generic — answer the questions for
                                  milestones tailored to you
                                </span>
                                <button
                                  onClick={() =>
                                    setCoachingState(goal.id, (current) => ({
                                      ...current,
                                      phase: current.answers.some((answer) =>
                                        answer.trim()
                                      )
                                        ? 'answering'
                                        : 'questionsReady',
                                      skippedQuestions: false,
                                      error: '',
                                    }))
                                  }
                                  className="ml-2 font-black underline"
                                  style={{ color: '#F5C542' }}
                                >
                                  Answer questions
                                </button>
                              </div>
                            )}

                            <div>
                              <p
                                className="text-sm"
                                style={{ color: 'rgba(255,255,255,0.5)' }}
                              >
                                Here are your personalized milestones
                              </p>
                              <p
                                className="mt-1 text-xs"
                                style={{ color: 'rgba(255,255,255,0.36)' }}
                              >
                                Edit any of these before saving
                              </p>
                            </div>

                            <div className="flex flex-col gap-2.5">
                              {coachingState.draftMilestones.map((milestone, index) => (
                                <div
                                  key={milestone.id}
                                  className="rounded-[10px] p-[14px]"
                                  style={{
                                    background: '#181818',
                                    border:
                                      index > 0
                                        ? '1px solid rgba(255,255,255,0.05)'
                                        : '1px solid rgba(255,255,255,0.05)',
                                  }}
                                >
                                  <div className="flex items-start gap-3">
                                    <div className="min-w-0 flex-1">
                                      <input
                                        value={milestone.title}
                                        onChange={(event) =>
                                          setCoachingState(goal.id, (current) => ({
                                            ...current,
                                            draftMilestones: current.draftMilestones.map((entry) =>
                                              entry.id === milestone.id
                                                ? {
                                                    ...entry,
                                                    title: event.target.value,
                                                  }
                                                : entry
                                            ),
                                          }))
                                        }
                                        className="w-full border-b border-white/7 bg-transparent pb-2 text-[15px] font-black outline-none"
                                        style={{ color: '#F0EFEB' }}
                                      />
                                      <textarea
                                        rows={2}
                                        value={milestone.description}
                                        onChange={(event) =>
                                          setCoachingState(goal.id, (current) => ({
                                            ...current,
                                            draftMilestones: current.draftMilestones.map((entry) =>
                                              entry.id === milestone.id
                                                ? {
                                                    ...entry,
                                                    description: event.target.value,
                                                  }
                                                : entry
                                            ),
                                          }))
                                        }
                                        onInput={(event) =>
                                          autoResizeTextarea(event.currentTarget)
                                        }
                                        className="mt-2 w-full resize-none overflow-hidden bg-transparent text-[13px] outline-none"
                                        style={{
                                          color: 'rgba(255,255,255,0.6)',
                                          fontFamily: 'Nunito, sans-serif',
                                        }}
                                      />
                                    </div>

                                    <button
                                      onClick={() =>
                                        setCoachingState(goal.id, (current) => ({
                                          ...current,
                                          draftMilestones: current.draftMilestones.filter(
                                            (entry) => entry.id !== milestone.id
                                          ),
                                        }))
                                      }
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

                            <div className="flex flex-col gap-2 sm:flex-row">
                              <button
                                onClick={() => handleSaveGeneratedMilestones(goal.id)}
                                disabled={coachingState.draftMilestones.length === 0}
                                className="flex-1 rounded-[14px] px-4 py-3 text-sm font-black transition-all duration-200 disabled:cursor-not-allowed"
                                style={{
                                  background:
                                    coachingState.draftMilestones.length === 0
                                      ? 'rgba(170,223,79,0.18)'
                                      : '#AADF4F',
                                  color:
                                    coachingState.draftMilestones.length === 0
                                      ? 'rgba(15,15,15,0.55)'
                                      : '#0F0F0F',
                                  opacity:
                                    coachingState.draftMilestones.length === 0
                                      ? 0.7
                                      : 1,
                                }}
                              >
                                Save these milestones
                              </button>

                              <button
                                onClick={() =>
                                  setCoachingState(goal.id, (current) => ({
                                    ...current,
                                    phase: 'questionsReady',
                                    answers: ['', '', ''],
                                    draftMilestones: [],
                                    skippedQuestions: false,
                                    error: '',
                                  }))
                                }
                                className="rounded-[14px] px-4 py-3 text-sm font-black transition-all duration-200"
                                style={{
                                  background: 'transparent',
                                  border: '1px solid rgba(255,255,255,0.12)',
                                  color: 'rgba(255,255,255,0.5)',
                                }}
                              >
                                Start over
                              </button>
                            </div>
                          </div>
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
                            className="flex flex-col gap-3 px-4 py-3 md:flex-row md:items-start"
                            style={{
                              background: '#181818',
                              borderTop:
                                index === 0
                                  ? 'none'
                                  : '1px solid rgba(255,255,255,0.05)',
                            }}
                          >
                            <div className="flex min-w-0 flex-1 gap-3">
                              <span
                                className="mt-1 h-2.5 w-2.5 flex-shrink-0 rounded-full"
                                style={{
                                  background: getMilestoneStatusColor(milestone.status),
                                }}
                              />

                              {editingMilestone?.milestoneId === milestone.id ? (
                                <div className="w-full">
                                  <input
                                    value={editingMilestone.title}
                                    onChange={(event) =>
                                      setEditingMilestone((current) =>
                                        current
                                          ? { ...current, title: event.target.value }
                                          : current
                                      )
                                    }
                                    className="w-full rounded-[14px] px-3 py-2 text-sm font-black outline-none transition-all duration-200 focus:border-white/20"
                                    style={INPUT_STYLES}
                                  />
                                  <textarea
                                    rows={2}
                                    value={editingMilestone.description}
                                    onChange={(event) =>
                                      setEditingMilestone((current) =>
                                        current
                                          ? {
                                              ...current,
                                              description: event.target.value,
                                            }
                                          : current
                                      )
                                    }
                                    onInput={(event) =>
                                      autoResizeTextarea(event.currentTarget)
                                    }
                                    className="mt-2 w-full resize-none overflow-hidden rounded-[14px] px-3 py-2 text-[13px] outline-none transition-all duration-200 focus:border-white/20"
                                    style={INPUT_STYLES}
                                  />
                                  <div className="mt-2 flex gap-2">
                                    <button
                                      onClick={() => {
                                        updateGoalMilestone(goal.id, milestone.id, {
                                          title: editingMilestone.title.trim() || milestone.title,
                                          description: editingMilestone.description.trim(),
                                        })
                                        setEditingMilestone(null)
                                      }}
                                      className="rounded-[12px] px-3 py-2 text-xs font-black"
                                      style={{
                                        background: '#AADF4F',
                                        color: '#0F0F0F',
                                      }}
                                    >
                                      Save
                                    </button>
                                    <button
                                      onClick={() => setEditingMilestone(null)}
                                      className="rounded-[12px] px-3 py-2 text-xs font-black"
                                      style={{
                                        background: 'transparent',
                                        border: '1px solid rgba(255,255,255,0.12)',
                                        color: 'rgba(255,255,255,0.5)',
                                      }}
                                    >
                                      Cancel
                                    </button>
                                  </div>
                                </div>
                              ) : (
                                <div className="min-w-0 flex-1">
                                  <p className="text-sm font-black" style={{ color: '#F0EFEB' }}>
                                    {milestone.title}
                                  </p>
                                  {milestone.description && (
                                    <p
                                      className="mt-1 text-[13px] leading-relaxed"
                                      style={{ color: 'rgba(255,255,255,0.6)' }}
                                    >
                                      {milestone.description}
                                    </p>
                                  )}
                                </div>
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
                                    description: milestone.description,
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
                        No milestones yet — add one or let coaching shape them
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
                            handleAddMilestone(goal.id)
                          }
                        }}
                        placeholder="Add a milestone..."
                        className="w-full rounded-[16px] px-4 py-3 text-sm outline-none transition-all duration-200 focus:border-white/20"
                        style={INPUT_STYLES}
                      />

                      <button
                        onClick={() => handleAddMilestone(goal.id)}
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
              const seasonItems = visiblePlan.filter(
                (item) => item.seasonKey === seasonKey
              )

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
                      <p
                        className="text-[11px]"
                        style={{ color: 'rgba(255,255,255,0.28)' }}
                      >
                        {season.dateRange}
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 flex flex-col gap-2.5">
                    {seasonItems.length === 0 ? (
                      <p
                        className="text-xs italic"
                        style={{ color: 'rgba(255,255,255,0.28)' }}
                      >
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
                                <p
                                  className="mt-1 text-[11px] leading-relaxed"
                                  style={{ color: 'rgba(255,255,255,0.36)' }}
                                >
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
                (e.g. Health &amp; Fitness, Career, Family — AI will suggest if you
                leave this blank)
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
              <div
                className="rounded-[16px] px-4 py-3 text-sm"
                style={ERROR_BANNER_STYLES}
              >
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
