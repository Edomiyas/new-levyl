import { useState } from 'react'
import { CheckCircle2, Circle, Zap, MessageSquare } from 'lucide-react'
import { useAppStore } from '../store/appStore'
import { LIFE_AREAS, SEASONS } from '../lib/constants'

const MOODS = [
  { emoji: '😴', label: 'Low' },
  { emoji: '😐', label: 'Meh' },
  { emoji: '🙂', label: 'Good' },
  { emoji: '😄', label: 'Great' },
  { emoji: '🔥', label: 'Fire' },
]

const DAYS = ['M', 'T', 'W', 'T', 'F', 'S', 'S']

const XP_PER_GOAL = 50

// ─── Sprint Strip (sidebar) ──────────────────────────────────────────────────

function SprintStrip({ weeksDone, currentWeek, seasonKey }: {
  weeksDone: number
  currentWeek: number | null
  seasonKey: string
}) {
  const cfg = SEASONS[seasonKey as keyof typeof SEASONS]

  return (
    <div
      className="rounded-xl p-4"
      style={{ background: '#181818', border: '1px solid rgba(255,255,255,0.07)' }}
    >
      <p className="text-[10px] font-black tracking-wider mb-3" style={{ color: 'rgba(255,255,255,0.36)' }}>
        SEASON SPRINT
      </p>
      <div className="flex gap-0.5 flex-wrap">
        {Array.from({ length: 12 }, (_, i) => {
          const wk = i + 1
          const isCurrent = wk === currentWeek
          const isPast = wk < (currentWeek ?? 0)

          return (
            <div
              key={wk}
              className="rounded flex items-center justify-center font-black"
              style={{
                width: 'calc((100% - 11 * 2px) / 12)',
                height: 26,
                fontSize: 9,
                background: isCurrent
                  ? cfg.color
                  : isPast
                  ? `${cfg.color}28`
                  : 'rgba(255,255,255,0.04)',
                color: isCurrent
                  ? '#0F0F0F'
                  : isPast
                  ? cfg.color
                  : 'rgba(255,255,255,0.18)',
                boxShadow: isCurrent ? `0 0 8px ${cfg.color}60` : 'none',
              }}
              title={`Week ${wk}`}
            >
              {wk}
            </div>
          )
        })}
      </div>
      <p className="text-[10px] mt-2" style={{ color: 'rgba(255,255,255,0.3)' }}>
        Week {currentWeek ?? 1} of 12 · {weeksDone} done
      </p>
    </div>
  )
}

// ─── Milestone Health Bars (sidebar) ────────────────────────────────────────

function MilestoneHealthBars({ milestones }: { milestones: { id: string; lifeAreaKey: string; title: string; weeklyGoals: { done: boolean }[] }[] }) {
  const active = milestones.filter((m) => m.weeklyGoals.length > 0)
  if (active.length === 0) return null

  return (
    <div
      className="rounded-xl p-4"
      style={{ background: '#181818', border: '1px solid rgba(255,255,255,0.07)' }}
    >
      <p className="text-[10px] font-black tracking-wider mb-3" style={{ color: 'rgba(255,255,255,0.36)' }}>
        MILESTONE HEALTH
      </p>
      <div className="flex flex-col gap-2.5">
        {active.map((ms) => {
          const area = LIFE_AREAS[ms.lifeAreaKey as keyof typeof LIFE_AREAS]
          const done = ms.weeklyGoals.filter((g) => g.done).length
          const total = ms.weeklyGoals.length
          const pct = total > 0 ? Math.round((done / total) * 100) : 0

          return (
            <div key={ms.id}>
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-1.5 min-w-0">
                  <span style={{ fontSize: 11 }}>{area.emoji}</span>
                  <span
                    className="text-[11px] font-bold truncate"
                    style={{ color: 'rgba(255,255,255,0.55)' }}
                    title={ms.title}
                  >
                    {ms.title}
                  </span>
                </div>
                <span className="text-[10px] font-black flex-shrink-0 ml-2" style={{ color: area.color }}>
                  {pct}%
                </span>
              </div>
              <div
                className="h-1.5 rounded-full overflow-hidden"
                style={{ background: 'rgba(255,255,255,0.06)' }}
              >
                <div
                  className="h-full rounded-full transition-all"
                  style={{ width: `${pct}%`, background: area.color }}
                />
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ─── Mood Log (sidebar) ───────────────────────────────────────────────────────

function MoodLog({ mood }: { mood: number | null }) {
  const today = new Date()
  const dateShort = today.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })

  return (
    <div
      className="rounded-xl p-4"
      style={{ background: '#181818', border: '1px solid rgba(255,255,255,0.07)' }}
    >
      <p className="text-[10px] font-black tracking-wider mb-3" style={{ color: 'rgba(255,255,255,0.36)' }}>
        MOOD LOG
      </p>
      {mood === null ? (
        <p className="text-xs" style={{ color: 'rgba(255,255,255,0.25)' }}>
          Log your mood above ↑
        </p>
      ) : (
        <div className="flex flex-col gap-2">
          <div
            className="flex items-center gap-2.5 p-2.5 rounded-lg"
            style={{ background: '#202020' }}
          >
            <span style={{ fontSize: 20 }}>{MOODS[mood].emoji}</span>
            <div>
              <p className="text-xs font-black" style={{ color: '#F0EFEB' }}>
                {MOODS[mood].label}
              </p>
              <p className="text-[10px]" style={{ color: 'rgba(255,255,255,0.3)' }}>
                {dateShort}
              </p>
            </div>
            <div
              className="ml-auto w-2 h-2 rounded-full"
              style={{ background: '#AADF4F', boxShadow: '0 0 6px #AADF4F' }}
            />
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Sunday Reflection (sidebar) ─────────────────────────────────────────────

function SundayReflection() {
  const [text, setText] = useState('')
  const today = new Date()
  const isSunday = today.getDay() === 0

  return (
    <div
      className="rounded-xl p-4"
      style={{
        background: isSunday ? 'rgba(168,158,245,0.06)' : '#181818',
        border: `1px solid ${isSunday ? 'rgba(168,158,245,0.2)' : 'rgba(255,255,255,0.07)'}`,
      }}
    >
      <div className="flex items-center gap-2 mb-3">
        <MessageSquare size={11} style={{ color: isSunday ? '#A89EF5' : 'rgba(255,255,255,0.36)' }} />
        <p
          className="text-[10px] font-black tracking-wider"
          style={{ color: isSunday ? '#A89EF5' : 'rgba(255,255,255,0.36)' }}
        >
          SUNDAY REFLECTION
        </p>
        {isSunday && (
          <span
            className="text-[9px] font-black px-1.5 py-0.5 rounded ml-auto"
            style={{ background: 'rgba(168,158,245,0.15)', color: '#A89EF5' }}
          >
            TODAY
          </span>
        )}
      </div>
      {isSunday ? (
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={4}
          placeholder="How was this week? What will you carry forward?"
          className="w-full resize-none text-xs leading-relaxed outline-none rounded-lg p-2.5"
          style={{
            background: '#202020',
            border: '1px solid rgba(168,158,245,0.15)',
            color: '#F0EFEB',
            fontFamily: 'Nunito, sans-serif',
          }}
        />
      ) : (
        <p className="text-[11px] leading-relaxed" style={{ color: 'rgba(255,255,255,0.3)' }}>
          Reflection unlocks on Sunday — come back to review your week.
        </p>
      )}
    </div>
  )
}

// ─── Today Page ──────────────────────────────────────────────────────────────

export function Today() {
  const { user, seasons, toggleGoalDone } = useAppStore()
  const [mood, setMood] = useState<number | null>(null)

  const currentSeason = seasons.find((s) => s.key === user.currentSeason)!
  const week = currentSeason.currentWeek ?? 1

  const jsDay = new Date().getDay()
  const dayIndex = jsDay === 0 ? 6 : jsDay - 1

  const activeMilestones = currentSeason.milestones.filter(
    (m) => m.weeklyGoals.some((g) => g.weekNumber === week)
  )

  const allWeekGoals = activeMilestones.flatMap((m) =>
    m.weeklyGoals.filter((g) => g.weekNumber === week)
  )
  const doneCount = allWeekGoals.filter((g) => g.done).length
  const xpToday = doneCount * XP_PER_GOAL

  const today = new Date()
  const dateStr = today.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  })

  return (
    <div className="flex gap-6 items-start">

      {/* ── LEFT MAIN ── */}
      <div className="flex-1 min-w-0 flex flex-col gap-6">

        {/* HEADER */}
        <div>
          <h1 className="text-3xl font-black" style={{ color: '#F0EFEB' }}>
            Today
          </h1>
          <p className="text-sm mt-1" style={{ color: 'rgba(255,255,255,0.36)' }}>
            {dateStr} · <span style={{ color: 'rgba(255,255,255,0.5)' }}>Week {week}</span>
          </p>
        </div>

        {/* MOOD STRIP */}
        <div
          className="rounded-xl p-4"
          style={{ background: '#181818', border: '1px solid rgba(255,255,255,0.07)' }}
        >
          <p className="text-[11px] font-black tracking-wider mb-3" style={{ color: 'rgba(255,255,255,0.36)' }}>
            HOW ARE YOU FEELING?
          </p>
          <div className="flex gap-2">
            {MOODS.map((m, i) => (
              <button
                key={i}
                onClick={() => setMood(i)}
                className="flex flex-col items-center gap-1.5 py-3 rounded-xl flex-1 transition-all"
                style={{
                  background: mood === i ? 'rgba(170,223,79,0.12)' : '#202020',
                  border: `1px solid ${mood === i ? 'rgba(170,223,79,0.45)' : 'rgba(255,255,255,0.04)'}`,
                  transform: mood === i ? 'scale(1.04)' : 'scale(1)',
                }}
              >
                <span style={{ fontSize: 24 }}>{m.emoji}</span>
                <span
                  className="text-[10px] font-bold"
                  style={{ color: mood === i ? '#AADF4F' : 'rgba(255,255,255,0.3)' }}
                >
                  {m.label}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* WEEK CONTEXT BANNER */}
        <div
          className="rounded-xl p-4"
          style={{ background: '#181818', border: '1px solid rgba(255,255,255,0.07)' }}
        >
          <div className="flex justify-between items-center mb-3">
            <p className="text-[11px] font-black tracking-wider" style={{ color: 'rgba(255,255,255,0.36)' }}>
              WEEK {week} PROGRESS
            </p>
            <span className="text-xs font-bold" style={{ color: '#AADF4F' }}>
              {doneCount}/{allWeekGoals.length} done
            </span>
          </div>
          <div className="flex gap-1.5">
            {DAYS.map((d, i) => {
              const isToday = i === dayIndex
              const isPast = i < dayIndex

              return (
                <div key={i} className="flex flex-col items-center gap-1.5 flex-1">
                  <div
                    className="w-full rounded-lg flex items-center justify-center font-black text-xs"
                    style={{
                      height: 36,
                      background: isToday
                        ? '#AADF4F'
                        : isPast
                        ? 'rgba(170,223,79,0.18)'
                        : 'rgba(255,255,255,0.04)',
                      color: isToday
                        ? '#0F0F0F'
                        : isPast
                        ? '#AADF4F'
                        : 'rgba(255,255,255,0.2)',
                      boxShadow: isToday ? '0 0 12px rgba(170,223,79,0.35)' : 'none',
                    }}
                  >
                    {d}
                  </div>
                  {isToday && (
                    <div
                      className="w-1.5 h-1.5 rounded-full"
                      style={{ background: '#AADF4F' }}
                    />
                  )}
                </div>
              )
            })}
          </div>
        </div>

        {/* MILESTONE-GROUPED GOALS */}
        {allWeekGoals.length === 0 ? (
          <div
            className="rounded-xl p-10 text-center"
            style={{ background: '#181818', border: '1px solid rgba(255,255,255,0.07)' }}
          >
            <p style={{ fontSize: 40, marginBottom: 12 }}>🎯</p>
            <p className="font-bold text-base" style={{ color: '#F0EFEB' }}>
              No goals for this week
            </p>
            <p className="text-sm mt-1" style={{ color: 'rgba(255,255,255,0.36)' }}>
              Head to Vision to add milestones and goals.
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {activeMilestones.map((ms) => {
              const area = LIFE_AREAS[ms.lifeAreaKey]
              const weekGoals = ms.weeklyGoals.filter((g) => g.weekNumber === week)
              if (weekGoals.length === 0) return null

              const done = weekGoals.filter((g) => g.done).length
              const pct = Math.round((done / weekGoals.length) * 100)

              return (
                <div
                  key={ms.id}
                  className="rounded-xl overflow-hidden"
                  style={{ border: '1px solid rgba(255,255,255,0.07)' }}
                >
                  {/* Milestone header strip */}
                  <div
                    className="px-4 py-3 flex items-center gap-3"
                    style={{ background: area.bg }}
                  >
                    <div
                      className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                      style={{ background: `${area.color}22`, fontSize: 15 }}
                    >
                      {area.emoji}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold truncate" style={{ color: '#F0EFEB' }}>
                        {ms.title}
                      </p>
                      <p className="text-[11px] font-bold mt-0.5" style={{ color: area.color }}>
                        {area.label} · {pct}% this week
                      </p>
                    </div>
                    <div
                      className="text-xs font-black px-2.5 py-1 rounded-full flex-shrink-0"
                      style={{ background: `${area.color}25`, color: area.color }}
                    >
                      {done}/{weekGoals.length}
                    </div>
                  </div>

                  {/* Goals */}
                  <div style={{ background: '#181818' }}>
                    {weekGoals.map((goal, idx) => (
                      <button
                        key={goal.id}
                        onClick={() => toggleGoalDone(goal.id)}
                        className="w-full flex items-start gap-3 px-4 py-3 text-left transition-all"
                        style={{
                          borderTop: idx > 0 ? '1px solid rgba(255,255,255,0.05)' : 'none',
                        }}
                        onMouseEnter={(e) => {
                          ;(e.currentTarget as HTMLButtonElement).style.background = '#202020'
                        }}
                        onMouseLeave={(e) => {
                          ;(e.currentTarget as HTMLButtonElement).style.background = 'transparent'
                        }}
                      >
                        <div className="mt-0.5 flex-shrink-0">
                          {goal.done ? (
                            <CheckCircle2 size={18} style={{ color: '#AADF4F' }} />
                          ) : (
                            <Circle size={18} style={{ color: 'rgba(255,255,255,0.2)' }} />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p
                            className="text-sm font-bold"
                            style={{
                              color: goal.done ? 'rgba(255,255,255,0.35)' : '#F0EFEB',
                              textDecoration: goal.done ? 'line-through' : 'none',
                            }}
                          >
                            {goal.title}
                          </p>
                          <p className="text-[11px] mt-0.5" style={{ color: 'rgba(255,255,255,0.25)' }}>
                            {goal.successCriteria}
                          </p>
                        </div>
                        {goal.done && (
                          <span
                            className="text-[10px] font-black px-2 py-0.5 rounded-full flex-shrink-0 mt-0.5"
                            style={{ background: 'rgba(170,223,79,0.12)', color: '#AADF4F' }}
                          >
                            +{XP_PER_GOAL} XP
                          </span>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* XP EARNED TODAY */}
        {xpToday > 0 && (
          <div
            className="rounded-xl px-4 py-3 flex items-center gap-3"
            style={{
              background: 'rgba(170,223,79,0.07)',
              border: '1px solid rgba(170,223,79,0.18)',
            }}
          >
            <Zap size={16} style={{ color: '#AADF4F' }} />
            <p className="text-sm font-bold" style={{ color: '#AADF4F' }}>
              {xpToday} XP earned today
            </p>
            <p className="text-xs ml-auto" style={{ color: 'rgba(255,255,255,0.35)' }}>
              {doneCount} goal{doneCount !== 1 ? 's' : ''} completed
            </p>
          </div>
        )}
      </div>

      {/* ── RIGHT SIDEBAR ── */}
      <div className="flex-shrink-0 flex flex-col gap-4" style={{ width: 272 }}>
        <SprintStrip
          weeksDone={currentSeason.weeksDone}
          currentWeek={currentSeason.currentWeek}
          seasonKey={user.currentSeason}
        />
        <MilestoneHealthBars milestones={currentSeason.milestones} />
        <MoodLog mood={mood} />
        <SundayReflection />
      </div>
    </div>
  )
}
