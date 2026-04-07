import { useState } from 'react'
import { CheckCircle2, Circle } from 'lucide-react'
import { useAppStore } from '../store/appStore'
import { LIFE_AREAS } from '../lib/constants'

const MOODS = ['😴', '😐', '🙂', '😄', '🔥']
const DAYS = ['M', 'T', 'W', 'T', 'F', 'S', 'S']

export function Today() {
  const { user, seasons, toggleGoalDone } = useAppStore()
  const [mood, setMood] = useState<number | null>(null)
  const currentSeason = seasons.find((s) => s.key === user.currentSeason)!
  const week = currentSeason.currentWeek ?? 1

  const activeMilestones = currentSeason.milestones.filter(
    (m) => m.status === 'active' || m.weeklyGoals.some((g) => g.weekNumber === week)
  )

  const todayIndex = new Date().getDay()
  const dayIndex = todayIndex === 0 ? 6 : todayIndex - 1

  const totalGoals = activeMilestones.flatMap((m) =>
    m.weeklyGoals.filter((g) => g.weekNumber === week)
  )
  const doneCount = totalGoals.filter((g) => g.done).length

  return (
    <div className="flex flex-col gap-6 max-w-2xl">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-900" style={{ color: '#F0EFEB' }}>
          Today
        </h1>
        <p className="text-sm mt-1" style={{ color: 'rgba(255,255,255,0.36)' }}>
          {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
          {' · '}Week {week}
        </p>
      </div>

      {/* Mood strip */}
      <div
        className="rounded-xl p-4"
        style={{ background: '#181818', border: '1px solid rgba(255,255,255,0.07)' }}
      >
        <p className="text-xs font-700 mb-3" style={{ color: 'rgba(255,255,255,0.36)' }}>
          HOW ARE YOU FEELING?
        </p>
        <div className="flex gap-2">
          {MOODS.map((m, i) => (
            <button
              key={i}
              onClick={() => setMood(i)}
              className="flex flex-col items-center gap-1 p-2.5 rounded-lg flex-1 transition-all"
              style={{
                background: mood === i ? 'rgba(170,223,79,0.12)' : '#202020',
                border: `1px solid ${mood === i ? 'rgba(170,223,79,0.4)' : 'transparent'}`,
              }}
            >
              <span className="text-2xl">{m}</span>
              <span
                className="text-[9px] font-600"
                style={{ color: mood === i ? '#AADF4F' : 'rgba(255,255,255,0.3)' }}
              >
                {['Low', 'Meh', 'Good', 'Great', 'Fire'][i]}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Week progress */}
      <div
        className="rounded-xl p-4"
        style={{ background: '#181818', border: '1px solid rgba(255,255,255,0.07)' }}
      >
        <div className="flex justify-between items-center mb-3">
          <p className="text-xs font-700" style={{ color: 'rgba(255,255,255,0.36)' }}>
            WEEK {week} PROGRESS
          </p>
          <span className="text-xs font-700" style={{ color: '#AADF4F' }}>
            {doneCount}/{totalGoals.length} done
          </span>
        </div>
        <div className="flex gap-1.5">
          {DAYS.map((d, i) => (
            <div key={i} className="flex flex-col items-center gap-1.5 flex-1">
              <div
                className="w-full h-8 rounded-md flex items-center justify-center text-xs font-700"
                style={{
                  background:
                    i < dayIndex
                      ? 'rgba(170,223,79,0.25)'
                      : i === dayIndex
                      ? '#AADF4F'
                      : 'rgba(255,255,255,0.04)',
                  color:
                    i < dayIndex
                      ? '#AADF4F'
                      : i === dayIndex
                      ? '#0F0F0F'
                      : 'rgba(255,255,255,0.2)',
                }}
              >
                {d}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Milestone-grouped goals */}
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
              {/* Milestone header */}
              <div
                className="px-4 py-3 flex items-center gap-3"
                style={{ background: area.bg }}
              >
                <span className="text-lg">{area.emoji}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-700 truncate" style={{ color: '#F0EFEB' }}>
                    {ms.title}
                  </p>
                  <p className="text-[11px] font-600" style={{ color: area.color }}>
                    {area.label} · {pct}% this week
                  </p>
                </div>
                <div
                  className="text-xs font-800 px-2.5 py-1 rounded-full"
                  style={{ background: `${area.color}22`, color: area.color }}
                >
                  {done}/{weekGoals.length}
                </div>
              </div>

              {/* Goals list */}
              <div style={{ background: '#181818' }}>
                {weekGoals.map((goal, idx) => (
                  <button
                    key={goal.id}
                    onClick={() => toggleGoalDone(goal.id)}
                    className="w-full flex items-start gap-3 px-4 py-3 text-left transition-all hover:bg-[#202020]"
                    style={{
                      borderTop: idx > 0 ? '1px solid rgba(255,255,255,0.05)' : 'none',
                    }}
                  >
                    <div className="mt-0.5 flex-shrink-0">
                      {goal.done ? (
                        <CheckCircle2 size={18} style={{ color: '#AADF4F' }} />
                      ) : (
                        <Circle size={18} style={{ color: 'rgba(255,255,255,0.2)' }} />
                      )}
                    </div>
                    <div className="flex-1">
                      <p
                        className="text-sm font-600"
                        style={{
                          color: goal.done ? 'rgba(255,255,255,0.36)' : '#F0EFEB',
                          textDecoration: goal.done ? 'line-through' : 'none',
                        }}
                      >
                        {goal.title}
                      </p>
                      <p className="text-[11px] mt-0.5" style={{ color: 'rgba(255,255,255,0.25)' }}>
                        {goal.successCriteria}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )
        })}
      </div>

      {totalGoals.length === 0 && (
        <div
          className="rounded-xl p-8 text-center"
          style={{ background: '#181818', border: '1px solid rgba(255,255,255,0.07)' }}
        >
          <p className="text-3xl mb-3">🎯</p>
          <p className="font-700" style={{ color: '#F0EFEB' }}>
            No goals for this week
          </p>
          <p className="text-sm mt-1" style={{ color: 'rgba(255,255,255,0.36)' }}>
            Head to Vision to add goals for your milestones.
          </p>
        </div>
      )}
    </div>
  )
}
