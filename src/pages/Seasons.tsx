import { useState } from 'react'
import { CheckCircle2, Circle } from 'lucide-react'
import { useAppStore } from '../store/appStore'
import { LIFE_AREAS, SEASONS, SEASON_ORDER } from '../lib/constants'
import type { SeasonKey } from '../types'

const NEXT_SEASON: Record<SeasonKey, SeasonKey> = {
  spring: 'summer',
  summer: 'fall',
  fall: 'winter',
  winter: 'spring',
}

export function Seasons() {
  const { user, seasons } = useAppStore()
  const [activeTab, setActiveTab] = useState<SeasonKey>(user.currentSeason)

  const activeSeason = seasons.find((s) => s.key === activeTab)!
  const cfg = SEASONS[activeTab]
  const isOverdue = activeSeason.status === 'overdue'
  const unresolvedCount = activeSeason.milestones.filter((m) => m.status !== 'done').length
  const nextSeasonKey = NEXT_SEASON[activeTab]
  const nextCfg = SEASONS[nextSeasonKey]

  // Order: current/overdue first → upcoming → done
  const sortedKeys = [
    ...SEASON_ORDER.filter((k) => {
      const s = seasons.find((x) => x.key === k)!
      return s.status === 'current' || s.status === 'overdue'
    }),
    ...SEASON_ORDER.filter((k) => seasons.find((x) => x.key === k)!.status === 'upcoming'),
    ...SEASON_ORDER.filter((k) => seasons.find((x) => x.key === k)!.status === 'done'),
  ]

  return (
    <div className="flex flex-col gap-6">

      {/* Page header */}
      <div>
        <p className="text-sm" style={{ color: 'rgba(255,255,255,0.36)' }}>Your year in</p>
        <h1 className="text-3xl font-black" style={{ color: '#F0EFEB' }}>Seasons 🌸</h1>
      </div>

      {/* Season tabs */}
      <div className="flex gap-3">
        {sortedKeys.map((key) => {
          const season = seasons.find((s) => s.key === key)!
          const sCfg = SEASONS[key]
          const isActive = key === activeTab
          const isDone = season.status === 'done'
          const isUpcoming = season.status === 'upcoming'
          const isCurrentOrOverdue = season.status === 'current' || season.status === 'overdue'
          const sUnresolved = season.milestones.filter((m) => m.status !== 'done').length

          return (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              className="flex flex-col gap-2 px-4 py-3 rounded-xl transition-all text-left"
              style={{
                flex: isCurrentOrOverdue ? 2 : 1,
                background: isActive ? `${sCfg.color}18` : '#181818',
                border: `1px solid ${isActive ? sCfg.color + '50' : 'rgba(255,255,255,0.07)'}`,
                opacity: isDone && !isActive ? 0.5 : isUpcoming && !isActive ? 0.6 : 1,
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
                  <p className="text-[11px]" style={{ color: 'rgba(255,255,255,0.28)' }}>
                    {sCfg.dateRange}
                  </p>
                </div>
              </div>

              {/* Status badge */}
              <div>
                {season.status === 'overdue' && sUnresolved > 0 ? (
                  <span
                    className="text-[10px] font-black px-2 py-0.5 rounded-full inline-flex items-center gap-1"
                    style={{ background: 'rgba(240,115,154,0.15)', color: '#F0739A' }}
                  >
                    <span
                      style={{
                        width: 5,
                        height: 5,
                        borderRadius: '50%',
                        background: '#F0739A',
                        display: 'inline-block',
                        flexShrink: 0,
                      }}
                    />
                    {sUnresolved} unresolved
                  </span>
                ) : isDone ? (
                  <span
                    className="text-[10px] font-black px-2 py-0.5 rounded-full"
                    style={{ background: 'rgba(170,223,79,0.1)', color: '#AADF4F' }}
                  >
                    ✓ Done
                  </span>
                ) : isUpcoming ? (
                  <span
                    className="text-[10px] font-black px-2 py-0.5 rounded-full"
                    style={{ background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.3)' }}
                  >
                    Upcoming
                  </span>
                ) : season.currentWeek ? (
                  <span
                    className="text-[10px] font-black px-2 py-0.5 rounded-full"
                    style={{ background: `${sCfg.color}18`, color: sCfg.color }}
                  >
                    Wk {season.currentWeek}
                  </span>
                ) : null}
              </div>
            </button>
          )
        })}
      </div>

      {/* Main two-column layout */}
      <div className="flex gap-5 items-start">

        {/* Left: milestone list */}
        <div className="flex flex-col gap-4" style={{ flex: '0 0 57%' }}>

          {/* Section heading */}
          <div>
            <h2 className="text-lg font-black" style={{ color: '#F0EFEB' }}>
              {cfg.label} milestones
            </h2>
            <p className="text-sm" style={{ color: 'rgba(255,255,255,0.36)' }}>
              {activeSeason.milestones.length} milestones this season
            </p>
          </div>

          {/* Overdue alert banner */}
          {isOverdue && unresolvedCount > 0 && (
            <div
              className="rounded-xl p-4 flex items-start gap-3"
              style={{
                background: 'rgba(240,80,80,0.07)',
                border: '1px solid rgba(240,80,80,0.18)',
              }}
            >
              <span style={{ fontSize: 18, flexShrink: 0 }}>⏰</span>
              <div>
                <p className="text-sm font-black" style={{ color: '#F07878' }}>
                  {cfg.label} has ended — {unresolvedCount} milestones unresolved
                </p>
                <p className="text-[12px] mt-0.5" style={{ color: 'rgba(255,255,255,0.4)' }}>
                  You must resolve each one before {nextCfg.label} begins. Mark it complete or
                  carry it forward to {nextCfg.label}.
                </p>
              </div>
            </div>
          )}

          {/* Milestone items */}
          <div className="flex flex-col gap-2">
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
                const isDone = ms.status === 'done'
                const isUnresolved = !isDone && isOverdue

                return (
                  <div
                    key={ms.id}
                    className="rounded-xl p-4"
                    style={{
                      background: '#181818',
                      border: '1px solid rgba(255,255,255,0.07)',
                    }}
                  >
                    <div className="flex items-start gap-3">
                      {/* Circle */}
                      <div className="flex-shrink-0 mt-0.5">
                        {isDone ? (
                          <CheckCircle2 size={20} style={{ color: '#5DCAA5' }} />
                        ) : ms.status === 'active' ? (
                          <Circle size={20} style={{ color: cfg.color, opacity: 0.65 }} />
                        ) : (
                          <Circle size={20} style={{ color: 'rgba(255,255,255,0.2)' }} />
                        )}
                      </div>

                      {/* Content */}
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
                        {ms.statusNote && (
                          <p
                            className="text-[12px] mt-0.5"
                            style={{ color: ms.atRisk ? '#F5C542' : 'rgba(255,255,255,0.36)' }}
                          >
                            {ms.statusNote}{ms.atRisk ? ' ⚠️' : ''}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Action buttons for unresolved milestones */}
                    {isUnresolved && (
                      <div className="flex gap-2 mt-3 ml-8">
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
              })
            )}
          </div>
        </div>

        {/* Right: season hero + 12-week sprint */}
        <div className="flex flex-col gap-4 flex-1 min-w-0">

          {/* Season hero card */}
          <div
            className="rounded-xl p-6 relative overflow-hidden"
            style={{
              background: `${cfg.color}0C`,
              border: `1px solid ${cfg.color}25`,
              minHeight: 210,
            }}
          >
            {/* Background radial decoration */}
            <div
              style={{
                position: 'absolute',
                right: -50,
                top: -50,
                width: 220,
                height: 220,
                borderRadius: '50%',
                background: `radial-gradient(circle, ${cfg.color}1A 0%, transparent 70%)`,
                pointerEvents: 'none',
              }}
            />

            <div className="relative flex flex-col gap-3">
              {/* Season pill */}
              <div
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-black self-start"
                style={{ background: `${cfg.color}20`, color: cfg.color }}
              >
                <span>{cfg.emoji}</span>
                <span>{cfg.label}</span>
              </div>

              {/* Hero emoji */}
              <p style={{ fontSize: 52, lineHeight: 1 }}>{cfg.heroEmoji}</p>

              {/* Date range */}
              <h3 className="text-2xl font-black" style={{ color: cfg.color }}>
                {cfg.dateRange}
              </h3>

              {/* Tagline */}
              <p className="text-sm" style={{ color: 'rgba(255,255,255,0.45)' }}>
                {cfg.tagline}
              </p>
            </div>
          </div>

          {/* 12-week sprint */}
          <div
            className="rounded-xl p-5"
            style={{ background: '#181818', border: '1px solid rgba(255,255,255,0.07)' }}
          >
            <p className="text-base font-black" style={{ color: '#F0EFEB' }}>
              12-week sprint
            </p>
            <p className="text-[12px] mt-0.5" style={{ color: 'rgba(255,255,255,0.36)' }}>
              {activeSeason.weeksDone} weeks done
              {activeSeason.currentWeek
                ? ` · Currently week ${activeSeason.currentWeek}`
                : ''}
            </p>

            {/* Sprint blocks */}
            <div className="flex gap-1 mt-4">
              {Array.from({ length: 12 }, (_, i) => {
                const wk = i + 1
                const isPast = wk <= activeSeason.weeksDone
                const isCurrent = wk === activeSeason.currentWeek
                return (
                  <div
                    key={wk}
                    className="flex-1 rounded"
                    style={{
                      height: 10,
                      background: isPast
                        ? cfg.color
                        : isCurrent
                        ? `${cfg.color}45`
                        : 'rgba(255,255,255,0.06)',
                    }}
                  />
                )
              })}
            </div>

            {/* Stats row */}
            <div className="flex justify-between mt-3">
              <p className="text-[12px] font-bold" style={{ color: cfg.color }}>
                {activeSeason.weeksDone} done
              </p>
              <p className="text-[12px] font-bold" style={{ color: 'rgba(255,255,255,0.36)' }}>
                {12 - activeSeason.weeksDone} weeks left
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
