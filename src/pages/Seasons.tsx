import { useState } from 'react'
import { CheckCircle2, Circle, ChevronRight, X, ArrowRight } from 'lucide-react'
import { useAppStore } from '../store/appStore'
import { LIFE_AREAS, SEASONS, SEASON_ORDER } from '../lib/constants'
import type { SeasonKey, Milestone } from '../types'

// ─── Resolution Modal ─────────────────────────────────────────────────────────

function ResolutionModal({
  milestones,
  seasonLabel,
  onClose,
}: {
  milestones: Milestone[]
  seasonLabel: string
  onClose: () => void
}) {
  const unfinished = milestones.filter((m) => m.status !== 'done')

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.8)' }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        className="w-full rounded-2xl p-6 flex flex-col gap-5"
        style={{
          maxWidth: 480,
          background: '#181818',
          border: '1px solid rgba(255,255,255,0.1)',
        }}
      >
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <p style={{ fontSize: 28, marginBottom: 4 }}>🏁</p>
            <h2 className="text-xl font-black" style={{ color: '#F0EFEB' }}>
              Season Complete!
            </h2>
            <p className="text-sm mt-0.5" style={{ color: 'rgba(255,255,255,0.36)' }}>
              {seasonLabel} is over. Resolve unfinished milestones.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg transition-colors"
            style={{ color: 'rgba(255,255,255,0.4)' }}
            onMouseEnter={(e) => ((e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.05)')}
            onMouseLeave={(e) => ((e.currentTarget as HTMLButtonElement).style.background = 'transparent')}
          >
            <X size={18} />
          </button>
        </div>

        {/* Unfinished milestones */}
        <div className="flex flex-col gap-2.5">
          {unfinished.length === 0 ? (
            <div className="rounded-xl p-5 text-center" style={{ background: '#202020' }}>
              <p style={{ fontSize: 28, marginBottom: 6 }}>🎉</p>
              <p className="font-bold" style={{ color: '#AADF4F' }}>All milestones completed!</p>
            </div>
          ) : (
            unfinished.map((ms) => {
              const area = LIFE_AREAS[ms.lifeAreaKey]
              return (
                <div
                  key={ms.id}
                  className="rounded-xl p-4 flex items-center gap-3"
                  style={{ background: '#202020' }}
                >
                  <div
                    className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
                    style={{ background: area.bg, fontSize: 15 }}
                  >
                    {area.emoji}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold truncate" style={{ color: '#F0EFEB' }}>
                      {ms.title}
                    </p>
                    <p className="text-[11px] font-bold mt-0.5" style={{ color: area.color }}>
                      {area.label}
                    </p>
                  </div>
                  <div className="flex gap-2 flex-shrink-0">
                    <button
                      onClick={onClose}
                      className="text-[11px] font-black px-3 py-1.5 rounded-lg transition-all"
                      style={{ background: 'rgba(93,202,165,0.15)', color: '#5DCAA5' }}
                    >
                      Mark Done
                    </button>
                    <button
                      onClick={onClose}
                      className="text-[11px] font-black px-3 py-1.5 rounded-lg flex items-center gap-1 transition-all"
                      style={{ background: 'rgba(245,197,66,0.15)', color: '#F5C542' }}
                    >
                      Carry Forward
                      <ArrowRight size={12} />
                    </button>
                  </div>
                </div>
              )
            })
          )}
        </div>

        <button
          onClick={onClose}
          className="w-full py-2.5 rounded-xl text-sm font-black transition-all"
          style={{ background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.5)' }}
        >
          Close
        </button>
      </div>
    </div>
  )
}

// ─── Seasons Page ─────────────────────────────────────────────────────────────

export function Seasons() {
  const { user, seasons } = useAppStore()
  const [activeTab, setActiveTab] = useState<SeasonKey>(user.currentSeason)
  const [selectedMilestoneId, setSelectedMilestoneId] = useState<string | null>(null)
  const [showResolutionModal, setShowResolutionModal] = useState(false)

  const activeSeason = seasons.find((s) => s.key === activeTab)!
  const cfg = SEASONS[activeTab]
  const isCurrentSeason = activeTab === user.currentSeason

  const selectedMilestone =
    selectedMilestoneId != null
      ? activeSeason.milestones.find((m) => m.id === selectedMilestoneId) ?? activeSeason.milestones[0]
      : activeSeason.milestones[0] ?? null

  return (
    <div className="flex flex-col gap-6">

      {/* ── SEASON TABS ── */}
      {/* Order: current (leftmost, 2×) → upcoming → done (rightmost, faded+strikethrough) */}
      <div className="flex gap-2">
        {[
          ...SEASON_ORDER.filter((k) => seasons.find((s) => s.key === k)?.status === 'current'),
          ...SEASON_ORDER.filter((k) => seasons.find((s) => s.key === k)?.status === 'upcoming'),
          ...SEASON_ORDER.filter((k) => seasons.find((s) => s.key === k)?.status === 'done'),
        ].map((key) => {
          const season = seasons.find((s) => s.key === key)!
          const sCfg = SEASONS[key]
          const isCurrent = key === user.currentSeason
          const isActive = key === activeTab
          const isDone = season.status === 'done'
          const isUpcoming = season.status === 'upcoming'
          const pct = Math.round((season.weeksDone / 12) * 100)

          return (
            <button
              key={key}
              onClick={() => {
                setActiveTab(key)
                setSelectedMilestoneId(null)
              }}
              className="flex flex-col gap-2 px-4 py-3 rounded-xl transition-all"
              style={{
                background: isActive ? `${sCfg.color}18` : '#181818',
                border: `1px solid ${isActive ? sCfg.color + '45' : 'rgba(255,255,255,0.07)'}`,
                flex: isCurrent ? 2 : 1,
                opacity: isDone ? (isActive ? 0.7 : 0.45) : isUpcoming && !isActive ? 0.55 : 1,
              }}
            >
              <div className="flex items-center justify-between gap-2">
                <span
                  className="text-sm font-black capitalize"
                  style={{
                    color: isActive ? sCfg.color : isDone ? 'rgba(255,255,255,0.35)' : 'rgba(255,255,255,0.45)',
                    textDecoration: isDone ? 'line-through' : 'none',
                    textDecorationColor: isDone ? 'rgba(255,255,255,0.25)' : 'transparent',
                  }}
                >
                  {sCfg.label}
                </span>
                <span
                  className="text-[10px] font-black px-2 py-0.5 rounded-full flex-shrink-0"
                  style={{
                    background: isActive ? `${sCfg.color}22` : 'rgba(255,255,255,0.05)',
                    color: isActive ? sCfg.color : isDone ? 'rgba(255,255,255,0.3)' : 'rgba(255,255,255,0.25)',
                  }}
                >
                  {isDone ? 'Done ✓' : isCurrent ? `Wk ${season.currentWeek}` : '🔒 Soon'}
                </span>
              </div>
              <div
                className="h-1 rounded-full overflow-hidden"
                style={{ background: 'rgba(255,255,255,0.06)' }}
              >
                <div
                  className="h-full rounded-full transition-all"
                  style={{ width: `${pct}%`, background: sCfg.color, opacity: isDone ? 0.5 : 1 }}
                />
              </div>
              <p className="text-[10px] text-left" style={{ color: 'rgba(255,255,255,0.28)' }}>
                {season.weeksDone}/12 weeks · {season.milestones.length} milestones
              </p>
            </button>
          )
        })}
      </div>

      {/* ── MAIN LAYOUT ── */}
      <div className="flex gap-5 items-start">

        {/* Milestone list */}
        <div className="flex-shrink-0 flex flex-col gap-2" style={{ width: 288 }}>
          <div className="flex items-center justify-between px-1 mb-1">
            <p className="text-[11px] font-black tracking-wider" style={{ color: 'rgba(255,255,255,0.36)' }}>
              MILESTONES ({activeSeason.milestones.length})
            </p>
            {isCurrentSeason && (
              <button
                onClick={() => setShowResolutionModal(true)}
                className="text-[10px] font-black px-2 py-1 rounded-lg transition-all"
                style={{ background: 'rgba(245,197,66,0.12)', color: '#F5C542' }}
              >
                End Season
              </button>
            )}
          </div>

          {activeSeason.milestones.length === 0 ? (
            <div
              className="rounded-xl p-8 text-center"
              style={{ background: '#181818', border: '1px solid rgba(255,255,255,0.07)' }}
            >
              <p style={{ fontSize: 28, marginBottom: 8 }}>🌱</p>
              <p className="text-sm font-bold" style={{ color: 'rgba(255,255,255,0.4)' }}>
                No milestones yet
              </p>
              <p className="text-xs mt-1" style={{ color: 'rgba(255,255,255,0.2)' }}>
                Add some from the Vision page
              </p>
            </div>
          ) : (
            activeSeason.milestones.map((ms) => {
              const area = LIFE_AREAS[ms.lifeAreaKey]
              const isSelected = ms.id === (selectedMilestone?.id ?? '')
              const doneGoals = ms.weeklyGoals.filter((g) => g.done).length
              const totalGoalsCount = ms.weeklyGoals.length
              const pct = totalGoalsCount > 0 ? Math.round((doneGoals / totalGoalsCount) * 100) : 0

              return (
                <button
                  key={ms.id}
                  onClick={() => setSelectedMilestoneId(ms.id)}
                  className="w-full rounded-xl p-3.5 flex items-start gap-3 text-left transition-all"
                  style={{
                    background: isSelected ? `${cfg.color}12` : '#181818',
                    border: `1px solid ${isSelected ? cfg.color + '35' : 'rgba(255,255,255,0.07)'}`,
                  }}
                >
                  <div
                    className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
                    style={{ background: area.bg, fontSize: 15 }}
                  >
                    {area.emoji}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p
                      className="text-sm font-bold leading-tight"
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
                          className="h-full rounded-full transition-all"
                          style={{ width: `${pct}%`, background: area.color }}
                        />
                      </div>
                      <span className="text-[10px] font-bold" style={{ color: area.color }}>
                        {pct}%
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 mt-1.5">
                      <span
                        className="text-[9px] font-black px-1.5 py-0.5 rounded"
                        style={{ background: area.bg, color: area.color }}
                      >
                        {area.label}
                      </span>
                      {ms.carriedOver && (
                        <span
                          className="text-[9px] font-black px-1.5 py-0.5 rounded"
                          style={{ background: 'rgba(245,197,66,0.12)', color: '#F5C542' }}
                        >
                          Carried over
                        </span>
                      )}
                    </div>
                  </div>
                  <ChevronRight
                    size={14}
                    style={{ color: isSelected ? cfg.color : 'rgba(255,255,255,0.2)', flexShrink: 0, marginTop: 2 }}
                  />
                </button>
              )
            })
          )}
        </div>

        {/* Detail panel */}
        <div className="flex-1 min-w-0">
          {selectedMilestone ? (
            <div className="flex flex-col gap-4">
              {/* Hero card */}
              {(() => {
                const area = LIFE_AREAS[selectedMilestone.lifeAreaKey]
                const doneGoals = selectedMilestone.weeklyGoals.filter((g) => g.done).length
                const totalGoalsCount = selectedMilestone.weeklyGoals.length
                const pct = totalGoalsCount > 0 ? Math.round((doneGoals / totalGoalsCount) * 100) : 0

                return (
                  <div
                    className="rounded-xl p-6"
                    style={{
                      background: area.bg,
                      border: `1px solid ${area.color}25`,
                    }}
                  >
                    <div className="flex items-start gap-4">
                      <div
                        className="w-14 h-14 rounded-xl flex items-center justify-center flex-shrink-0"
                        style={{ background: `${area.color}25`, fontSize: 26 }}
                      >
                        {area.emoji}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xl font-black leading-tight" style={{ color: '#F0EFEB' }}>
                          {selectedMilestone.title}
                        </p>
                        <p className="text-sm font-bold mt-1" style={{ color: area.color }}>
                          {area.label} · {cfg.label} Season
                        </p>
                        <div className="flex items-center gap-3 mt-4">
                          <div
                            className="h-2.5 flex-1 rounded-full overflow-hidden"
                            style={{ background: 'rgba(255,255,255,0.12)' }}
                          >
                            <div
                              className="h-full rounded-full transition-all"
                              style={{ width: `${pct}%`, background: area.color }}
                            />
                          </div>
                          <span className="text-base font-black flex-shrink-0" style={{ color: area.color }}>
                            {pct}%
                          </span>
                        </div>
                        <p className="text-xs mt-1.5" style={{ color: 'rgba(255,255,255,0.4)' }}>
                          {doneGoals} of {totalGoalsCount} weekly goals completed
                        </p>
                      </div>
                    </div>
                  </div>
                )
              })()}

              {/* 12-Week strip */}
              <div
                className="rounded-xl p-4"
                style={{ background: '#181818', border: '1px solid rgba(255,255,255,0.07)' }}
              >
                <p className="text-[11px] font-black tracking-wider mb-3" style={{ color: 'rgba(255,255,255,0.36)' }}>
                  12-WEEK STRIP
                </p>
                <div className="flex gap-1">
                  {Array.from({ length: 12 }, (_, i) => {
                    const weekNum = i + 1
                    const goalsForWeek = selectedMilestone.weeklyGoals.filter(
                      (g) => g.weekNumber === weekNum
                    )
                    const hasGoal = goalsForWeek.length > 0
                    const allDone = hasGoal && goalsForWeek.every((g) => g.done)
                    const isCurrent = weekNum === activeSeason.currentWeek
                    const isPast = weekNum < (activeSeason.currentWeek ?? 0)

                    return (
                      <div
                        key={weekNum}
                        className="flex-1 rounded flex items-center justify-center font-black"
                        style={{
                          height: 34,
                          fontSize: 10,
                          background: isCurrent
                            ? cfg.color
                            : allDone
                            ? `${cfg.color}28`
                            : isPast
                            ? 'rgba(255,255,255,0.06)'
                            : 'rgba(255,255,255,0.03)',
                          color: isCurrent
                            ? '#0F0F0F'
                            : allDone
                            ? cfg.color
                            : isPast
                            ? 'rgba(255,255,255,0.35)'
                            : 'rgba(255,255,255,0.15)',
                          border: isCurrent ? 'none' : `1px solid ${hasGoal && !allDone ? cfg.color + '30' : 'rgba(255,255,255,0.04)'}`,
                          boxShadow: isCurrent ? `0 0 10px ${cfg.color}50` : 'none',
                        }}
                        title={`Week ${weekNum}`}
                      >
                        {weekNum}
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* Weekly goals list */}
              <div
                className="rounded-xl overflow-hidden"
                style={{ border: '1px solid rgba(255,255,255,0.07)' }}
              >
                <div
                  className="px-4 py-3"
                  style={{ background: '#202020', borderBottom: '1px solid rgba(255,255,255,0.06)' }}
                >
                  <p className="text-[11px] font-black tracking-wider" style={{ color: 'rgba(255,255,255,0.36)' }}>
                    WEEKLY GOALS
                  </p>
                </div>

                {selectedMilestone.weeklyGoals.length === 0 ? (
                  <div className="p-8 text-center" style={{ background: '#181818' }}>
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
                        borderTop: idx > 0 ? '1px solid rgba(255,255,255,0.04)' : 'none',
                      }}
                    >
                      <div className="mt-0.5 flex-shrink-0">
                        {goal.done ? (
                          <CheckCircle2 size={16} style={{ color: '#AADF4F' }} />
                        ) : (
                          <Circle size={16} style={{ color: 'rgba(255,255,255,0.2)' }} />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <span
                            className="text-[10px] font-black px-1.5 py-0.5 rounded flex-shrink-0"
                            style={{
                              background: goal.weekNumber === activeSeason.currentWeek
                                ? `${cfg.color}20`
                                : 'rgba(255,255,255,0.06)',
                              color: goal.weekNumber === activeSeason.currentWeek
                                ? cfg.color
                                : 'rgba(255,255,255,0.38)',
                            }}
                          >
                            Wk {goal.weekNumber}
                          </span>
                          <p
                            className="text-sm font-bold"
                            style={{
                              color: goal.done ? 'rgba(255,255,255,0.35)' : '#F0EFEB',
                              textDecoration: goal.done ? 'line-through' : 'none',
                            }}
                          >
                            {goal.title}
                          </p>
                        </div>
                        <p className="text-[11px]" style={{ color: 'rgba(255,255,255,0.25)' }}>
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
              className="rounded-xl p-14 text-center"
              style={{ background: '#181818', border: '1px solid rgba(255,255,255,0.07)' }}
            >
              <p style={{ fontSize: 36, marginBottom: 10 }}>🍃</p>
              <p className="font-bold" style={{ color: 'rgba(255,255,255,0.4)' }}>
                Select a milestone to view details
              </p>
            </div>
          )}
        </div>
      </div>

      {/* ── RESOLUTION MODAL ── */}
      {showResolutionModal && (
        <ResolutionModal
          milestones={activeSeason.milestones}
          seasonLabel={cfg.label}
          onClose={() => setShowResolutionModal(false)}
        />
      )}
    </div>
  )
}
