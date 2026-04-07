import { useState } from 'react'
import { CheckCircle2, Circle, Zap } from 'lucide-react'
import { useAppStore } from '../store/appStore'
import { LIFE_AREAS } from '../lib/constants'

const MOODS = [
  { emoji: '😴', label: 'Low' },
  { emoji: '😐', label: 'Meh' },
  { emoji: '🙂', label: 'Good' },
  { emoji: '😄', label: 'Great' },
  { emoji: '🔥', label: 'Fire' },
]

const DAYS = ['M', 'T', 'W', 'T', 'F', 'S', 'S']

// XP awarded per completed goal (mock)
const XP_PER_GOAL = 50

export function Today() {
  const { user, seasons, toggleGoalDone } = useAppStore()
  const [mood, setMood] = useState<number | null>(null)

  const currentSeason = seasons.find((s) => s.key === user.currentSeason)!
  const week = currentSeason.currentWeek ?? 1

  // Today's day index (0 = Mon, 6 = Sun)
  const jsDay = new Date().getDay() // 0 = Sun
  const dayIndex = jsDay === 0 ? 6 : jsDay - 1

  // Milestones with goals for this week
  const activeMilestones = currentSeason.milestones.filter(
    (m) => m.weeklyGoals.some((g) => g.weekNumber === week)
  )

  const allWeekGoals = activeMilestones.flatMap((m) =>
    m.weeklyGoals.filter((g) => g.weekNumber === week)
  )
  const doneCount = allWeekGoals.filter((g) => g.done).length
  const xpToday = allWeekGoals.filter((g) => g.done).length * XP_PER_GOAL

  const today = new Date()
  const dateStr = today.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  })

  return (
    <div className="flex flex-col gap-6" style={{ maxWidth: '42rem' }}>

      {/* ── HEADER ── */}
      <div>
        <h1 className="text-3xl font-black" style={{ color: '#F0EFEB' }}>
          Today
        </h1>
        <p className="text-sm mt-1" style={{ color: 'rgba(255,255,255,0.36)' }}>
          {dateStr} · <span style={{ color: 'rgba(255,255,255,0.5)' }}>Week {week}</span>
        </p>
      </div>

      {/* ── MOOD STRIP ── */}
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

      {/* ── WEEK PROGRESS ── */}
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

      {/* ── MILESTONE-GROUPED GOALS ── */}
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

      {/* ── XP EARNED TODAY ── */}
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
  )
}
