import { useState } from 'react'
import { CheckCircle2, Circle, Plus, X, ChevronLeft, Check } from 'lucide-react'
import { useAppStore } from '../store/appStore'
import { LIFE_AREAS, SEASONS, SEASON_ORDER } from '../lib/constants'
import type { SeasonKey, Milestone, WeeklyGoal } from '../types'

const NEXT_SEASON: Record<SeasonKey, SeasonKey> = {
  spring: 'summer',
  summer: 'fall',
  fall: 'winter',
  winter: 'spring',
}

// ─── Add Weekly Goal Modal ─────────────────────────────────────────────────────

function AddWeeklyGoalModal({
  milestoneTitle,
  currentWeek,
  totalWeeks,
  seasonColor,
  preselectedWeek,
  onClose,
  onSubmit,
}: {
  milestoneTitle: string
  currentWeek: number | null
  totalWeeks: number
  seasonColor: string
  preselectedWeek: number | null
  onClose: () => void
  onSubmit: (goal: Omit<WeeklyGoal, 'id' | 'milestoneId'>) => void
}) {
  const [week, setWeek] = useState<number>(preselectedWeek ?? currentWeek ?? 1)
  const [title, setTitle] = useState('')
  const [criteria, setCriteria] = useState('')
  const canSubmit = title.trim().length > 0

  const handleSubmit = () => {
    if (!canSubmit) return
    onSubmit({ weekNumber: week, title: title.trim(), successCriteria: criteria.trim(), done: false })
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.8)' }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        className="w-full rounded-2xl p-6 flex flex-col gap-5"
        style={{ maxWidth: 440, background: '#181818', border: '1px solid rgba(255,255,255,0.1)' }}
      >
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-lg font-black" style={{ color: '#F0EFEB' }}>Add weekly task</h2>
            <p className="text-xs mt-0.5 truncate" style={{ color: 'rgba(255,255,255,0.36)', maxWidth: 300 }}>
              {milestoneTitle}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg"
            style={{ color: 'rgba(255,255,255,0.4)' }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Week selector */}
        <div>
          <label className="text-[11px] font-black tracking-wider block mb-2" style={{ color: 'rgba(255,255,255,0.36)' }}>
            ASSIGN TO WEEK
          </label>
          <div className="flex flex-wrap gap-1.5">
            {Array.from({ length: totalWeeks }, (_, i) => {
              const wk = i + 1
              const isCurrent = wk === currentWeek
              const isSelected = wk === week
              return (
                <button
                  key={wk}
                  onClick={() => setWeek(wk)}
                  className="w-8 h-8 rounded-lg text-xs font-black flex items-center justify-center transition-all"
                  style={{
                    background: isSelected ? seasonColor : isCurrent ? `${seasonColor}20` : 'rgba(255,255,255,0.05)',
                    color: isSelected ? '#0F0F0F' : isCurrent ? seasonColor : 'rgba(255,255,255,0.4)',
                    border: `1px solid ${isSelected ? 'transparent' : isCurrent ? `${seasonColor}40` : 'rgba(255,255,255,0.06)'}`,
                  }}
                >
                  {wk}
                </button>
              )
            })}
          </div>
          {currentWeek && (
            <p className="text-[10px] mt-1.5" style={{ color: 'rgba(255,255,255,0.28)' }}>
              Currently on week {currentWeek}
            </p>
          )}
        </div>

        {/* Task title */}
        <div>
          <label className="text-[11px] font-black tracking-wider block mb-2" style={{ color: 'rgba(255,255,255,0.36)' }}>
            TASK
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
            placeholder="e.g. Research and outline first chapter"
            autoFocus
            className="w-full px-4 py-3 rounded-xl text-sm outline-none"
            style={{
              background: '#202020',
              border: `1px solid ${title ? 'rgba(255,255,255,0.12)' : 'rgba(255,255,255,0.07)'}`,
              color: '#F0EFEB',
              fontFamily: 'Nunito, sans-serif',
            }}
          />
        </div>

        {/* Success criteria */}
        <div>
          <label className="text-[11px] font-black tracking-wider block mb-2" style={{ color: 'rgba(255,255,255,0.36)' }}>
            HOW WILL YOU KNOW IT'S DONE? <span style={{ color: 'rgba(255,255,255,0.2)' }}>(optional)</span>
          </label>
          <input
            type="text"
            value={criteria}
            onChange={(e) => setCriteria(e.target.value)}
            placeholder="e.g. 500-word outline saved in Notion"
            className="w-full px-4 py-3 rounded-xl text-sm outline-none"
            style={{
              background: '#202020',
              border: '1px solid rgba(255,255,255,0.07)',
              color: '#F0EFEB',
              fontFamily: 'Nunito, sans-serif',
            }}
          />
        </div>

        {/* Submit */}
        <button
          onClick={handleSubmit}
          disabled={!canSubmit}
          className="w-full py-3 rounded-xl text-sm font-black flex items-center justify-center gap-2 transition-all"
          style={{
            background: canSubmit ? seasonColor : 'rgba(255,255,255,0.06)',
            color: canSubmit ? '#0F0F0F' : 'rgba(255,255,255,0.2)',
            cursor: canSubmit ? 'pointer' : 'not-allowed',
          }}
        >
          {canSubmit && <Check size={15} />}
          Add task to Week {week}
        </button>
      </div>
    </div>
  )
}

// ─── Milestone Detail Panel ────────────────────────────────────────────────────

function MilestoneDetail({
  milestone,
  currentWeek,
  seasonColor,
  onBack,
  onAddGoal,
}: {
  milestone: Milestone
  currentWeek: number | null
  seasonColor: string
  onBack: () => void
  onAddGoal: (weekHint: number | null) => void
}) {
  const { toggleGoalDone } = useAppStore()
  const area = LIFE_AREAS[milestone.lifeAreaKey]

  const doneCount = milestone.weeklyGoals.filter((g) => g.done).length
  const totalCount = milestone.weeklyGoals.length

  // Group goals by week
  const goalsByWeek: Record<number, WeeklyGoal[]> = {}
  milestone.weeklyGoals.forEach((g) => {
    if (!goalsByWeek[g.weekNumber]) goalsByWeek[g.weekNumber] = []
    goalsByWeek[g.weekNumber].push(g)
  })
  const usedWeeks = Object.keys(goalsByWeek).map(Number).sort((a, b) => a - b)

  return (
    <div className="flex flex-col gap-4">
      {/* Back + header */}
      <div
        className="rounded-xl p-4"
        style={{ background: '#181818', border: '1px solid rgba(255,255,255,0.07)' }}
      >
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 text-[11px] font-black mb-3 transition-opacity hover:opacity-70"
          style={{ color: 'rgba(255,255,255,0.36)' }}
        >
          <ChevronLeft size={13} />
          Back to season
        </button>
        <div className="flex items-start gap-3">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ background: area.bg, fontSize: 18 }}
          >
            {area.emoji}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-base font-black leading-tight" style={{ color: '#F0EFEB' }}>
              {milestone.title}
            </p>
            <div className="flex items-center gap-2 mt-1">
              <span
                className="text-[10px] font-black px-2 py-0.5 rounded-full"
                style={{ background: area.bg, color: area.color }}
              >
                {area.label}
              </span>
              <span className="text-[11px]" style={{ color: 'rgba(255,255,255,0.36)' }}>
                {totalCount === 0 ? 'No tasks yet' : `${doneCount}/${totalCount} tasks done`}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 12-week grid */}
      <div
        className="rounded-xl p-4"
        style={{ background: '#181818', border: '1px solid rgba(255,255,255,0.07)' }}
      >
        <div className="flex items-center justify-between mb-3">
          <p className="text-[11px] font-black tracking-wider" style={{ color: 'rgba(255,255,255,0.36)' }}>
            12-WEEK PLAN
          </p>
          <button
            onClick={() => onAddGoal(currentWeek)}
            className="flex items-center gap-1 text-[11px] font-black px-2.5 py-1 rounded-lg transition-all"
            style={{ background: `${seasonColor}18`, color: seasonColor }}
          >
            <Plus size={11} />
            Add task
          </button>
        </div>
        <div className="flex gap-1">
          {Array.from({ length: 12 }, (_, i) => {
            const wk = i + 1
            const isCurrent = wk === currentWeek
            const weekGoals = goalsByWeek[wk] ?? []
            const hasGoals = weekGoals.length > 0
            const allDone = hasGoals && weekGoals.every((g) => g.done)

            return (
              <button
                key={wk}
                onClick={() => onAddGoal(wk)}
                className="flex-1 rounded flex flex-col items-center justify-center gap-0.5 transition-all"
                style={{
                  height: 40,
                  background: isCurrent
                    ? seasonColor
                    : allDone
                    ? `${seasonColor}28`
                    : hasGoals
                    ? `${seasonColor}12`
                    : 'rgba(255,255,255,0.04)',
                  border: `1px solid ${hasGoals && !isCurrent ? seasonColor + '30' : 'transparent'}`,
                  boxShadow: isCurrent ? `0 0 8px ${seasonColor}50` : 'none',
                }}
                title={`Week ${wk}${hasGoals ? ` — ${weekGoals.length} task${weekGoals.length > 1 ? 's' : ''}` : ' — click to add task'}`}
              >
                <span
                  className="font-black"
                  style={{
                    fontSize: 9,
                    color: isCurrent ? '#0F0F0F' : hasGoals ? seasonColor : 'rgba(255,255,255,0.2)',
                  }}
                >
                  {wk}
                </span>
                {hasGoals && (
                  <div
                    style={{
                      width: 4,
                      height: 4,
                      borderRadius: '50%',
                      background: isCurrent ? '#0F0F0F' : seasonColor,
                      opacity: 0.8,
                    }}
                  />
                )}
              </button>
            )
          })}
        </div>
        <p className="text-[10px] mt-2" style={{ color: 'rgba(255,255,255,0.25)' }}>
          Click any week to add a task · Highlighted weeks have tasks
        </p>
      </div>

      {/* Goals list */}
      {totalCount === 0 ? (
        <div
          className="rounded-xl p-8 text-center"
          style={{ background: '#181818', border: '1px solid rgba(255,255,255,0.07)' }}
        >
          <p style={{ fontSize: 32, marginBottom: 8 }}>📋</p>
          <p className="text-sm font-bold" style={{ color: 'rgba(255,255,255,0.4)' }}>No tasks yet</p>
          <p className="text-xs mt-1" style={{ color: 'rgba(255,255,255,0.2)' }}>
            Click a week above or use "Add task" to get started
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {usedWeeks.map((wk) => {
            const goals = goalsByWeek[wk]
            const isCurrent = wk === currentWeek
            return (
              <div
                key={wk}
                className="rounded-xl overflow-hidden"
                style={{ border: '1px solid rgba(255,255,255,0.07)' }}
              >
                {/* Week header */}
                <div
                  className="flex items-center justify-between px-4 py-2.5"
                  style={{
                    background: isCurrent ? `${seasonColor}14` : '#202020',
                    borderBottom: '1px solid rgba(255,255,255,0.06)',
                  }}
                >
                  <span
                    className="text-[11px] font-black"
                    style={{ color: isCurrent ? seasonColor : 'rgba(255,255,255,0.5)' }}
                  >
                    Week {wk}{isCurrent ? ' · Current' : ''}
                  </span>
                  <span className="text-[10px]" style={{ color: 'rgba(255,255,255,0.3)' }}>
                    {goals.filter((g) => g.done).length}/{goals.length} done
                  </span>
                </div>
                {/* Goals */}
                {goals.map((goal, idx) => (
                  <button
                    key={goal.id}
                    onClick={() => toggleGoalDone(goal.id)}
                    className="w-full flex items-start gap-3 px-4 py-3 text-left transition-all"
                    style={{
                      background: '#181818',
                      borderTop: idx > 0 ? '1px solid rgba(255,255,255,0.04)' : 'none',
                    }}
                    onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = '#202020' }}
                    onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = '#181818' }}
                  >
                    <div className="flex-shrink-0 mt-0.5">
                      {goal.done ? (
                        <CheckCircle2 size={16} style={{ color: '#AADF4F' }} />
                      ) : (
                        <Circle size={16} style={{ color: 'rgba(255,255,255,0.2)' }} />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p
                        className="text-sm font-bold"
                        style={{
                          color: goal.done ? 'rgba(255,255,255,0.35)' : '#F0EFEB',
                          textDecoration: goal.done ? 'line-through' : 'none',
                          textDecorationColor: 'rgba(255,255,255,0.2)',
                        }}
                      >
                        {goal.title}
                      </p>
                      {goal.successCriteria && (
                        <p className="text-[11px] mt-0.5" style={{ color: 'rgba(255,255,255,0.25)' }}>
                          {goal.successCriteria}
                        </p>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

// ─── Seasons Page ──────────────────────────────────────────────────────────────

export function Seasons() {
  const { user, seasons, addWeeklyGoal } = useAppStore()
  const [activeTab, setActiveTab] = useState<SeasonKey>(user.currentSeason)
  const [selectedMilestoneId, setSelectedMilestoneId] = useState<string | null>(null)
  const [showAddGoal, setShowAddGoal] = useState(false)
  const [preselectedWeek, setPreselectedWeek] = useState<number | null>(null)

  const activeSeason = seasons.find((s) => s.key === activeTab)!
  const cfg = SEASONS[activeTab]
  const isOverdue = activeSeason.status === 'overdue'
  const unresolvedCount = activeSeason.milestones.filter((m) => m.status !== 'done').length
  const nextSeasonKey = NEXT_SEASON[activeTab]
  const nextCfg = SEASONS[nextSeasonKey]

  const selectedMilestone = selectedMilestoneId
    ? activeSeason.milestones.find((m) => m.id === selectedMilestoneId) ?? null
    : null

  // Order: current/overdue → upcoming → done
  const sortedKeys = [
    ...SEASON_ORDER.filter((k) => {
      const s = seasons.find((x) => x.key === k)!
      return s.status === 'current' || s.status === 'overdue'
    }),
    ...SEASON_ORDER.filter((k) => seasons.find((x) => x.key === k)!.status === 'upcoming'),
    ...SEASON_ORDER.filter((k) => seasons.find((x) => x.key === k)!.status === 'done'),
  ]

  const primaryKey = sortedKeys[0]
  const secondaryKeys = sortedKeys.slice(1)

  const handleTabChange = (key: SeasonKey) => {
    setActiveTab(key)
    setSelectedMilestoneId(null)
  }

  const handleAddGoal = (weekHint: number | null) => {
    setPreselectedWeek(weekHint)
    setShowAddGoal(true)
  }

  const handleGoalSubmit = (goalData: Omit<WeeklyGoal, 'id' | 'milestoneId'>) => {
    if (!selectedMilestoneId) return
    const goal: WeeklyGoal = {
      id: `g-${Date.now()}`,
      milestoneId: selectedMilestoneId,
      ...goalData,
    }
    addWeeklyGoal(selectedMilestoneId, goal)
    setShowAddGoal(false)
    setPreselectedWeek(null)
  }

  return (
    <div className="flex flex-col gap-6">

      {/* Page header */}
      <div>
        <p className="text-sm" style={{ color: 'rgba(255,255,255,0.36)' }}>Your year in</p>
        <h1 className="text-3xl font-black" style={{ color: '#F0EFEB' }}>Seasons 🌸</h1>
      </div>

      {/* Season tabs */}
      <div className="flex gap-5">
        {/* Primary tab */}
        {(() => {
          const season = seasons.find((s) => s.key === primaryKey)!
          const sCfg = SEASONS[primaryKey]
          const isActive = primaryKey === activeTab
          const sUnresolved = season.milestones.filter((m) => m.status !== 'done').length
          return (
            <button
              onClick={() => handleTabChange(primaryKey)}
              className="flex flex-col gap-2 px-4 py-3 rounded-xl transition-all text-left"
              style={{
                flex: '0 0 57%',
                background: isActive ? `${sCfg.color}18` : '#181818',
                border: `1px solid ${isActive ? sCfg.color + '50' : 'rgba(255,255,255,0.07)'}`,
              }}
            >
              <div className="flex items-center gap-2">
                <span style={{ fontSize: 20 }}>{sCfg.emoji}</span>
                <div>
                  <p className="text-sm font-black" style={{ color: isActive ? sCfg.color : 'rgba(255,255,255,0.5)' }}>
                    {sCfg.label}
                  </p>
                  <p className="text-[11px]" style={{ color: 'rgba(255,255,255,0.28)' }}>{sCfg.dateRange}</p>
                </div>
              </div>
              <div>
                {sUnresolved > 0 ? (
                  <span
                    className="text-[10px] font-black px-2 py-0.5 rounded-full inline-flex items-center gap-1"
                    style={{ background: 'rgba(240,115,154,0.15)', color: '#F0739A' }}
                  >
                    <span style={{ width: 5, height: 5, borderRadius: '50%', background: '#F0739A', display: 'inline-block' }} />
                    {sUnresolved} unresolved
                  </span>
                ) : (
                  <span
                    className="text-[10px] font-black px-2 py-0.5 rounded-full"
                    style={{ background: `${sCfg.color}18`, color: sCfg.color }}
                  >
                    Wk {season.currentWeek ?? 1}
                  </span>
                )}
              </div>
            </button>
          )
        })()}

        {/* Secondary tabs */}
        <div className="flex-1 flex gap-3">
          {secondaryKeys.map((key) => {
            const season = seasons.find((s) => s.key === key)!
            const sCfg = SEASONS[key]
            const isActive = key === activeTab
            const isDone = season.status === 'done'
            return (
              <button
                key={key}
                onClick={() => handleTabChange(key)}
                className="flex-1 flex flex-col gap-2 px-4 py-3 rounded-xl transition-all text-left"
                style={{
                  background: isActive ? `${sCfg.color}18` : '#181818',
                  border: `1px solid ${isActive ? sCfg.color + '50' : 'rgba(255,255,255,0.07)'}`,
                  opacity: isDone && !isActive ? 0.5 : !isActive ? 0.6 : 1,
                }}
              >
                <div className="flex items-center gap-2">
                  <span style={{ fontSize: 20 }}>{sCfg.emoji}</span>
                  <div>
                    <p
                      className="text-sm font-black"
                      style={{
                        color: isActive ? sCfg.color : isDone ? 'rgba(255,255,255,0.3)' : 'rgba(255,255,255,0.5)',
                        textDecoration: isDone ? 'line-through' : 'none',
                        textDecorationColor: 'rgba(255,255,255,0.2)',
                      }}
                    >
                      {sCfg.label}
                    </p>
                    <p className="text-[11px]" style={{ color: 'rgba(255,255,255,0.28)' }}>{sCfg.dateRange}</p>
                  </div>
                </div>
                <div>
                  {isDone ? (
                    <span className="text-[10px] font-black px-2 py-0.5 rounded-full" style={{ background: 'rgba(170,223,79,0.1)', color: '#AADF4F' }}>
                      ✓ Done
                    </span>
                  ) : (
                    <span className="text-[10px] font-black px-2 py-0.5 rounded-full" style={{ background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.3)' }}>
                      Upcoming
                    </span>
                  )}
                </div>
              </button>
            )
          })}
        </div>
      </div>

      {/* Main two-column layout */}
      <div className="flex gap-5 items-start">

        {/* Left: milestone list */}
        <div className="flex flex-col gap-4" style={{ flex: '0 0 57%' }}>

          <div>
            <h2 className="text-lg font-black" style={{ color: '#F0EFEB' }}>
              {cfg.label} milestones
            </h2>
            <p className="text-sm" style={{ color: 'rgba(255,255,255,0.36)' }}>
              {activeSeason.milestones.length} milestones this season
            </p>
          </div>

          {/* Overdue alert */}
          {isOverdue && unresolvedCount > 0 && (
            <div
              className="rounded-xl p-4 flex items-start gap-3"
              style={{ background: 'rgba(240,80,80,0.07)', border: '1px solid rgba(240,80,80,0.18)' }}
            >
              <span style={{ fontSize: 18, flexShrink: 0 }}>⏰</span>
              <div>
                <p className="text-sm font-black" style={{ color: '#F07878' }}>
                  {cfg.label} has ended — {unresolvedCount} milestones unresolved
                </p>
                <p className="text-[12px] mt-0.5" style={{ color: 'rgba(255,255,255,0.4)' }}>
                  You must resolve each one before {nextCfg.label} begins. Mark it complete or carry it forward to {nextCfg.label}.
                </p>
              </div>
            </div>
          )}

          {/* Empty state */}
          {activeSeason.milestones.length === 0 ? (
            <div
              className="rounded-xl p-10 text-center"
              style={{ background: '#181818', border: '1px solid rgba(255,255,255,0.07)' }}
            >
              <p style={{ fontSize: 32, marginBottom: 8 }}>🌱</p>
              <p className="text-sm font-bold" style={{ color: 'rgba(255,255,255,0.4)' }}>No milestones yet</p>
              <p className="text-xs mt-1" style={{ color: 'rgba(255,255,255,0.2)' }}>
                Go to Vision to add milestones to this season
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {activeSeason.milestones.map((ms) => {
                const area = LIFE_AREAS[ms.lifeAreaKey]
                const isDone = ms.status === 'done'
                const isUnresolved = !isDone && isOverdue
                const isSelected = ms.id === selectedMilestoneId
                const goalCount = ms.weeklyGoals.length
                const doneGoals = ms.weeklyGoals.filter((g) => g.done).length

                return (
                  <div key={ms.id}>
                    <button
                      onClick={() => setSelectedMilestoneId(isSelected ? null : ms.id)}
                      className="w-full rounded-xl p-4 text-left transition-all"
                      style={{
                        background: isSelected ? `${cfg.color}12` : '#181818',
                        border: `1px solid ${isSelected ? cfg.color + '40' : 'rgba(255,255,255,0.07)'}`,
                      }}
                    >
                      <div className="flex items-start gap-3">
                        <div className="flex-shrink-0 mt-0.5">
                          {isDone ? (
                            <CheckCircle2 size={20} style={{ color: '#5DCAA5' }} />
                          ) : ms.status === 'active' ? (
                            <Circle size={20} style={{ color: cfg.color, opacity: 0.65 }} />
                          ) : (
                            <Circle size={20} style={{ color: 'rgba(255,255,255,0.2)' }} />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-3">
                            <p
                              className="text-sm font-bold"
                              style={{
                                color: isDone ? 'rgba(255,255,255,0.4)' : '#F0EFEB',
                                textDecoration: isDone ? 'line-through' : 'none',
                                textDecorationColor: 'rgba(255,255,255,0.2)',
                              }}
                            >
                              {ms.title}
                            </p>
                            <span
                              className="text-[10px] font-black px-2 py-0.5 rounded-full flex-shrink-0"
                              style={{ background: area.bg, color: area.color }}
                            >
                              {area.label}
                            </span>
                          </div>
                          <div className="flex items-center gap-3 mt-1">
                            {ms.statusNote && (
                              <p className="text-[12px]" style={{ color: ms.atRisk ? '#F5C542' : 'rgba(255,255,255,0.36)' }}>
                                {ms.statusNote}{ms.atRisk ? ' ⚠️' : ''}
                              </p>
                            )}
                            {goalCount > 0 && (
                              <span className="text-[11px] font-bold" style={{ color: 'rgba(255,255,255,0.3)' }}>
                                {doneGoals}/{goalCount} tasks
                              </span>
                            )}
                            {goalCount === 0 && !isDone && (
                              <span className="text-[11px]" style={{ color: 'rgba(255,255,255,0.2)' }}>
                                No tasks yet — click to add
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </button>

                    {/* Overdue action buttons */}
                    {isUnresolved && (
                      <div className="flex gap-2 mt-1.5 ml-11">
                        <button
                          className="text-[11px] font-black px-3 py-1.5 rounded-lg transition-all"
                          style={{ background: 'rgba(93,202,165,0.12)', color: '#5DCAA5' }}
                        >
                          ✓ Mark complete
                        </button>
                        <button
                          className="text-[11px] font-black px-3 py-1.5 rounded-lg flex items-center gap-1 transition-all"
                          style={{ background: 'rgba(245,197,66,0.12)', color: '#F5C542' }}
                        >
                          → Move to {nextCfg.label}
                        </button>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Right panel */}
        <div className="flex flex-col gap-4 flex-1 min-w-0">
          {selectedMilestone ? (
            <MilestoneDetail
              milestone={selectedMilestone}
              currentWeek={activeSeason.currentWeek}
              seasonColor={cfg.color}
              onBack={() => setSelectedMilestoneId(null)}
              onAddGoal={handleAddGoal}
            />
          ) : (
            <>
              {/* Season hero card */}
              <div
                className="rounded-xl p-6 relative overflow-hidden"
                style={{ background: `${cfg.color}0C`, border: `1px solid ${cfg.color}25`, minHeight: 210 }}
              >
                <div style={{ position: 'absolute', right: -50, top: -50, width: 220, height: 220, borderRadius: '50%', background: `radial-gradient(circle, ${cfg.color}1A 0%, transparent 70%)`, pointerEvents: 'none' }} />
                <div className="relative flex flex-col gap-3">
                  <div
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-black self-start"
                    style={{ background: `${cfg.color}20`, color: cfg.color }}
                  >
                    <span>{cfg.emoji}</span>
                    <span>{cfg.label}</span>
                  </div>
                  <p style={{ fontSize: 52, lineHeight: 1 }}>{cfg.heroEmoji}</p>
                  <h3 className="text-2xl font-black" style={{ color: cfg.color }}>{cfg.dateRange}</h3>
                  <p className="text-sm" style={{ color: 'rgba(255,255,255,0.45)' }}>{cfg.tagline}</p>
                </div>
              </div>

              {/* 12-week sprint */}
              <div
                className="rounded-xl p-5"
                style={{ background: '#181818', border: '1px solid rgba(255,255,255,0.07)' }}
              >
                <p className="text-base font-black" style={{ color: '#F0EFEB' }}>12-week sprint</p>
                <p className="text-[12px] mt-0.5" style={{ color: 'rgba(255,255,255,0.36)' }}>
                  {activeSeason.weeksDone} weeks done{activeSeason.currentWeek ? ` · Currently week ${activeSeason.currentWeek}` : ''}
                </p>
                <div className="flex gap-1 mt-4">
                  {Array.from({ length: 12 }, (_, i) => {
                    const wk = i + 1
                    return (
                      <div
                        key={wk}
                        className="flex-1 rounded"
                        style={{
                          height: 10,
                          background: wk <= activeSeason.weeksDone ? cfg.color : wk === activeSeason.currentWeek ? `${cfg.color}45` : 'rgba(255,255,255,0.06)',
                        }}
                      />
                    )
                  })}
                </div>
                <div className="flex justify-between mt-3">
                  <p className="text-[12px] font-bold" style={{ color: cfg.color }}>{activeSeason.weeksDone} done</p>
                  <p className="text-[12px] font-bold" style={{ color: 'rgba(255,255,255,0.36)' }}>{12 - activeSeason.weeksDone} weeks left</p>
                </div>
              </div>

              {/* Hint if milestones have no tasks */}
              {activeSeason.milestones.some((m) => m.weeklyGoals.length === 0 && m.status !== 'done') && (
                <div
                  className="rounded-xl p-4 flex items-start gap-3"
                  style={{ background: `${cfg.color}08`, border: `1px solid ${cfg.color}20` }}
                >
                  <span style={{ fontSize: 16 }}>💡</span>
                  <div>
                    <p className="text-[12px] font-black" style={{ color: cfg.color }}>
                      Assign weekly tasks
                    </p>
                    <p className="text-[11px] mt-0.5" style={{ color: 'rgba(255,255,255,0.36)' }}>
                      Click a milestone on the left to break it into weekly tasks across the 12 weeks.
                    </p>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Add weekly goal modal */}
      {showAddGoal && selectedMilestone && (
        <AddWeeklyGoalModal
          milestoneTitle={selectedMilestone.title}
          currentWeek={activeSeason.currentWeek}
          totalWeeks={12}
          seasonColor={cfg.color}
          preselectedWeek={preselectedWeek}
          onClose={() => { setShowAddGoal(false); setPreselectedWeek(null) }}
          onSubmit={handleGoalSubmit}
        />
      )}
    </div>
  )
}
