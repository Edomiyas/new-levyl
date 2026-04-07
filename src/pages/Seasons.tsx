import { useState } from 'react'
import { CheckCircle2, Circle, ChevronRight } from 'lucide-react'
import { useAppStore } from '../store/appStore'
import { LIFE_AREAS, SEASONS, SEASON_ORDER } from '../lib/constants'
import type { SeasonKey } from '../types'

export function Seasons() {
  const { user, seasons } = useAppStore()
  const [activeTab, setActiveTab] = useState<SeasonKey>(user.currentSeason)
  const [selectedMilestoneId, setSelectedMilestoneId] = useState<string | null>(null)

  const activeSeason = seasons.find((s) => s.key === activeTab)!
  const cfg = SEASONS[activeTab]
  const selectedMilestone =
    selectedMilestoneId != null
      ? activeSeason.milestones.find((m) => m.id === selectedMilestoneId)
      : activeSeason.milestones[0]

  return (
    <div className="flex flex-col gap-6">
      {/* Season tabs */}
      <div className="flex gap-2">
        {SEASON_ORDER.map((key) => {
          const season = seasons.find((s) => s.key === key)!
          const sCfg = SEASONS[key]
          const isCurrent = key === user.currentSeason
          const isActive = key === activeTab

          return (
            <button
              key={key}
              onClick={() => {
                setActiveTab(key)
                setSelectedMilestoneId(null)
              }}
              className="flex flex-col gap-1 px-5 py-3 rounded-xl transition-all"
              style={{
                background: isActive ? `${sCfg.color}15` : '#181818',
                border: `1px solid ${isActive ? sCfg.color + '40' : 'rgba(255,255,255,0.07)'}`,
                flex: isCurrent ? '2' : '1',
                opacity: season.status === 'upcoming' ? 0.6 : 1,
              }}
            >
              <div className="flex items-center justify-between">
                <span
                  className="text-sm font-800 capitalize"
                  style={{ color: isActive ? sCfg.color : 'rgba(255,255,255,0.5)' }}
                >
                  {sCfg.label}
                </span>
                {isCurrent && (
                  <span
                    className="text-[10px] font-700 px-2 py-0.5 rounded-full"
                    style={{ background: `${sCfg.color}22`, color: sCfg.color }}
                  >
                    CURRENT
                  </span>
                )}
                {season.status === 'done' && (
                  <span className="text-[10px]" style={{ color: 'rgba(255,255,255,0.3)' }}>
                    DONE
                  </span>
                )}
              </div>
              <div
                className="h-1 rounded-full overflow-hidden"
                style={{ background: 'rgba(255,255,255,0.06)' }}
              >
                <div
                  className="h-full rounded-full"
                  style={{
                    width: `${Math.round((season.weeksDone / 12) * 100)}%`,
                    background: sCfg.color,
                  }}
                />
              </div>
              <p className="text-[10px] text-left" style={{ color: 'rgba(255,255,255,0.3)' }}>
                {season.weeksDone}/12 weeks
              </p>
            </button>
          )
        })}
      </div>

      {/* Main layout */}
      <div className="flex gap-5">
        {/* Milestone list */}
        <div className="w-72 flex-shrink-0 flex flex-col gap-2">
          <p className="text-xs font-700 px-1" style={{ color: 'rgba(255,255,255,0.36)' }}>
            MILESTONES ({activeSeason.milestones.length})
          </p>
          {activeSeason.milestones.map((ms) => {
            const area = LIFE_AREAS[ms.lifeAreaKey]
            const isSelected = ms.id === (selectedMilestone?.id ?? activeSeason.milestones[0]?.id)
            const doneGoals = ms.weeklyGoals.filter((g) => g.done).length
            const totalGoals = ms.weeklyGoals.length

            return (
              <button
                key={ms.id}
                onClick={() => setSelectedMilestoneId(ms.id)}
                className="w-full rounded-xl p-3 flex items-start gap-3 text-left transition-all"
                style={{
                  background: isSelected ? `${cfg.color}10` : '#181818',
                  border: `1px solid ${isSelected ? cfg.color + '30' : 'rgba(255,255,255,0.07)'}`,
                }}
              >
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-sm flex-shrink-0"
                  style={{ background: area.bg }}
                >
                  {area.emoji}
                </div>
                <div className="flex-1 min-w-0">
                  <p
                    className="text-sm font-700 leading-tight"
                    style={{ color: isSelected ? '#F0EFEB' : 'rgba(255,255,255,0.7)' }}
                  >
                    {ms.title}
                  </p>
                  <div className="flex items-center gap-2 mt-1.5">
                    <div
                      className="h-1 flex-1 rounded-full overflow-hidden"
                      style={{ background: 'rgba(255,255,255,0.06)' }}
                    >
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: totalGoals > 0 ? `${Math.round((doneGoals / totalGoals) * 100)}%` : '0%',
                          background: area.color,
                        }}
                      />
                    </div>
                    <span className="text-[10px] font-600 flex-shrink-0" style={{ color: area.color }}>
                      {doneGoals}/{totalGoals}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 mt-1">
                    <span
                      className="text-[9px] font-700 px-1.5 py-0.5 rounded"
                      style={{ background: area.bg, color: area.color }}
                    >
                      {area.label}
                    </span>
                    {ms.carriedOver && (
                      <span
                        className="text-[9px] font-700 px-1.5 py-0.5 rounded"
                        style={{ background: 'rgba(245,197,66,0.1)', color: '#F5C542' }}
                      >
                        Carried over
                      </span>
                    )}
                  </div>
                </div>
                <ChevronRight size={14} style={{ color: 'rgba(255,255,255,0.2)', flexShrink: 0 }} />
              </button>
            )
          })}

          {activeSeason.milestones.length === 0 && (
            <div
              className="rounded-xl p-6 text-center"
              style={{ background: '#181818', border: '1px solid rgba(255,255,255,0.07)' }}
            >
              <p className="text-2xl mb-2">🌱</p>
              <p className="text-sm font-700" style={{ color: 'rgba(255,255,255,0.4)' }}>
                No milestones yet
              </p>
            </div>
          )}
        </div>

        {/* Detail panel */}
        <div className="flex-1">
          {selectedMilestone ? (
            <div className="flex flex-col gap-4">
              {/* Hero card */}
              {(() => {
                const area = LIFE_AREAS[selectedMilestone.lifeAreaKey]
                const doneGoals = selectedMilestone.weeklyGoals.filter((g) => g.done).length
                const totalGoals = selectedMilestone.weeklyGoals.length
                const pct = totalGoals > 0 ? Math.round((doneGoals / totalGoals) * 100) : 0

                return (
                  <div
                    className="rounded-xl p-6"
                    style={{
                      background: area.bg,
                      border: `1px solid ${area.color}22`,
                    }}
                  >
                    <div className="flex items-start gap-4">
                      <div
                        className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl flex-shrink-0"
                        style={{ background: `${area.color}22` }}
                      >
                        {area.emoji}
                      </div>
                      <div className="flex-1">
                        <p className="text-lg font-800" style={{ color: '#F0EFEB' }}>
                          {selectedMilestone.title}
                        </p>
                        <p className="text-sm mt-0.5 font-600" style={{ color: area.color }}>
                          {area.label} · {cfg.label} Season
                        </p>
                        <div className="flex items-center gap-3 mt-4">
                          <div
                            className="h-2 flex-1 rounded-full overflow-hidden"
                            style={{ background: 'rgba(255,255,255,0.12)' }}
                          >
                            <div
                              className="h-full rounded-full transition-all"
                              style={{ width: `${pct}%`, background: area.color }}
                            />
                          </div>
                          <span className="text-sm font-800" style={{ color: area.color }}>
                            {pct}%
                          </span>
                        </div>
                        <p className="text-xs mt-1" style={{ color: 'rgba(255,255,255,0.4)' }}>
                          {doneGoals} of {totalGoals} weekly goals completed
                        </p>
                      </div>
                    </div>
                  </div>
                )
              })()}

              {/* Week strip */}
              <div
                className="rounded-xl p-4"
                style={{ background: '#181818', border: '1px solid rgba(255,255,255,0.07)' }}
              >
                <p className="text-xs font-700 mb-3" style={{ color: 'rgba(255,255,255,0.36)' }}>
                  12-WEEK STRIP
                </p>
                <div className="flex gap-1">
                  {Array.from({ length: 12 }, (_, i) => {
                    const weekNum = i + 1
                    const hasGoal = selectedMilestone.weeklyGoals.some(
                      (g) => g.weekNumber === weekNum
                    )
                    const isDone = selectedMilestone.weeklyGoals
                      .filter((g) => g.weekNumber === weekNum)
                      .every((g) => g.done)
                    const isCurrent = weekNum === activeSeason.currentWeek

                    return (
                      <div
                        key={weekNum}
                        className="flex-1 h-8 rounded flex items-center justify-center text-[10px] font-700"
                        style={{
                          background: isDone && hasGoal
                            ? `${cfg.color}30`
                            : isCurrent
                            ? cfg.color
                            : weekNum <= (activeSeason.weeksDone)
                            ? 'rgba(255,255,255,0.08)'
                            : 'rgba(255,255,255,0.03)',
                          color: isCurrent
                            ? '#0F0F0F'
                            : isDone && hasGoal
                            ? cfg.color
                            : 'rgba(255,255,255,0.3)',
                          border: isCurrent ? 'none' : '1px solid rgba(255,255,255,0.05)',
                        }}
                        title={`Week ${weekNum}`}
                      >
                        {weekNum}
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* Weekly goals */}
              <div
                className="rounded-xl overflow-hidden"
                style={{ border: '1px solid rgba(255,255,255,0.07)' }}
              >
                <div
                  className="px-4 py-3"
                  style={{ background: '#181818', borderBottom: '1px solid rgba(255,255,255,0.07)' }}
                >
                  <p className="text-xs font-700" style={{ color: 'rgba(255,255,255,0.36)' }}>
                    WEEKLY GOALS
                  </p>
                </div>
                {selectedMilestone.weeklyGoals.length === 0 ? (
                  <div
                    className="p-6 text-center"
                    style={{ background: '#181818' }}
                  >
                    <p className="text-sm" style={{ color: 'rgba(255,255,255,0.3)' }}>
                      No weekly goals added yet
                    </p>
                  </div>
                ) : (
                  selectedMilestone.weeklyGoals.map((goal, idx) => (
                    <div
                      key={goal.id}
                      className="flex items-start gap-3 px-4 py-3"
                      style={{
                        background: '#181818',
                        borderTop: idx > 0 ? '1px solid rgba(255,255,255,0.05)' : 'none',
                      }}
                    >
                      <div className="mt-0.5 flex-shrink-0">
                        {goal.done ? (
                          <CheckCircle2 size={16} style={{ color: '#AADF4F' }} />
                        ) : (
                          <Circle size={16} style={{ color: 'rgba(255,255,255,0.2)' }} />
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span
                            className="text-[10px] font-700 px-1.5 py-0.5 rounded"
                            style={{
                              background: 'rgba(255,255,255,0.06)',
                              color: 'rgba(255,255,255,0.4)',
                            }}
                          >
                            Wk {goal.weekNumber}
                          </span>
                          <p
                            className="text-sm font-600"
                            style={{
                              color: goal.done ? 'rgba(255,255,255,0.36)' : '#F0EFEB',
                              textDecoration: goal.done ? 'line-through' : 'none',
                            }}
                          >
                            {goal.title}
                          </p>
                        </div>
                        <p className="text-[11px] mt-0.5" style={{ color: 'rgba(255,255,255,0.25)' }}>
                          {goal.successCriteria}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          ) : (
            <div
              className="rounded-xl p-12 text-center"
              style={{ background: '#181818', border: '1px solid rgba(255,255,255,0.07)' }}
            >
              <p className="text-3xl mb-3">🍃</p>
              <p className="font-700" style={{ color: 'rgba(255,255,255,0.4)' }}>
                Select a milestone to view details
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
