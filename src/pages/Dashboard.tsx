import { useAppStore } from '../store/appStore'
import { LIFE_AREAS, SEASONS, SEASON_ORDER } from '../lib/constants'
import type { LifeAreaKey } from '../types'

// ─── Arc Ring ─────────────────────────────────────────────────────────────────

function polarToCartesian(cx: number, cy: number, r: number, angleDeg: number) {
  const rad = (angleDeg * Math.PI) / 180
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) }
}

function ArcRing({
  color,
  progress,
  label,
  subtext,
  needsFocus,
}: {
  color: string
  progress: number
  label: string
  subtext: string
  needsFocus?: boolean
}) {
  const cx = 50, cy = 52, r = 38, sw = 7
  const startAngle = 135
  const totalSweep = 270

  const bgStart = polarToCartesian(cx, cy, r, startAngle)
  const bgEnd = polarToCartesian(cx, cy, r, startAngle + totalSweep)
  const bgPath = `M ${bgStart.x.toFixed(2)} ${bgStart.y.toFixed(2)} A ${r} ${r} 0 1 1 ${bgEnd.x.toFixed(2)} ${bgEnd.y.toFixed(2)}`

  const sweep = (progress / 100) * totalSweep
  const endAngle = startAngle + sweep
  const progEnd = polarToCartesian(cx, cy, r, endAngle)
  const largeArc = sweep > 180 ? 1 : 0
  const progPath =
    progress > 0
      ? `M ${bgStart.x.toFixed(2)} ${bgStart.y.toFixed(2)} A ${r} ${r} 0 ${largeArc} 1 ${progEnd.x.toFixed(2)} ${progEnd.y.toFixed(2)}`
      : ''

  return (
    <div className="flex flex-col items-center gap-1">
      <svg
        width="86"
        height="74"
        viewBox="0 0 100 92"
        style={{ overflow: 'visible' }}
      >
        <path
          d={bgPath}
          fill="none"
          stroke="rgba(255,255,255,0.07)"
          strokeWidth={sw}
          strokeLinecap="round"
        />
        {progress > 0 && (
          <path
            d={progPath}
            fill="none"
            stroke={color}
            strokeWidth={sw}
            strokeLinecap="round"
          />
        )}
      </svg>
      <div className="text-center -mt-1">
        <p className="text-sm font-black" style={{ color }}>
          {label}
        </p>
        <p className="text-2xl font-black leading-tight" style={{ color }}>
          {progress}%
        </p>
        <p
          className="text-[11px] mt-0.5"
          style={{ color: needsFocus ? '#F5C542' : 'rgba(255,255,255,0.36)' }}
        >
          {needsFocus ? '⚠ ' : ''}
          {subtext}
        </p>
      </div>
    </div>
  )
}

// ─── Stat Card ────────────────────────────────────────────────────────────────

function StatCard({
  value,
  label,
  subtext,
  color,
}: {
  value: string
  label: string
  subtext: string
  color: string
}) {
  return (
    <div
      className="flex-1 rounded-2xl p-5 relative overflow-hidden"
      style={{ background: '#181818', border: '1px solid rgba(255,255,255,0.07)' }}
    >
      {/* Blob decoration */}
      <div
        style={{
          position: 'absolute',
          top: -24,
          right: -24,
          width: 100,
          height: 100,
          borderRadius: '50%',
          background: color,
          opacity: 0.13,
          pointerEvents: 'none',
        }}
      />
      <div className="relative">
        <p
          className="font-black leading-none"
          style={{ fontSize: '2.75rem', color }}
        >
          {value}
        </p>
        <p className="text-sm font-bold mt-2" style={{ color: 'rgba(255,255,255,0.55)' }}>
          {label}
        </p>
        <p className="text-[12px] mt-1" style={{ color }}>
          {subtext}
        </p>
      </div>
    </div>
  )
}

// ─── Dashboard ────────────────────────────────────────────────────────────────

export function Dashboard() {
  const { user, seasons, badges } = useAppStore()
  const currentSeason = seasons.find((s) => s.key === user.currentSeason)!

  const xpToNext = 2000
  const xpPct = Math.min(100, Math.round((user.xp / xpToNext) * 100))

  const lifeAreaProgress: Record<LifeAreaKey, number> = {
    physical: 74,
    mind: 60,
    spiritual: 45,
    wealth: 55,
    community: 18,
    family: 50,
  }

  const overallProgress = 62
  const activeGoalsCount = 14

  const earnedBadges = badges.filter((b) => b.earned).length

  return (
    <div className="flex flex-col gap-6">

      {/* Page header */}
      <div>
        <p className="text-sm" style={{ color: 'rgba(255,255,255,0.36)' }}>
          Your life at a glance
        </p>
        <h1 className="text-3xl font-black" style={{ color: '#F0EFEB' }}>
          Dashboard 📊
        </h1>
      </div>

      {/* Stat cards */}
      <div className="flex gap-4">
        <StatCard
          value={`${overallProgress}%`}
          label="Overall progress"
          subtext="↑ 8% from last season"
          color="#AADF4F"
        />
        <StatCard
          value={`${user.streak}d`}
          label="Current streak"
          subtext="Personal best 🔥"
          color="#F5C542"
        />
        <StatCard
          value={`${activeGoalsCount}`}
          label="Active goals"
          subtext="Across 6 life areas"
          color="#5DCAA5"
        />
        <StatCard
          value={`${earnedBadges}/${badges.length}`}
          label="Badges earned"
          subtext={`${badges.length - earnedBadges} more to unlock`}
          color="#A89EF5"
        />
      </div>

      {/* Life tree + Season progress */}
      <div
        className="rounded-2xl p-6"
        style={{ background: '#181818', border: '1px solid rgba(255,255,255,0.07)' }}
      >
        <div className="flex gap-10">
          {/* Left: tree */}
          <div className="flex-1 flex flex-col gap-4 min-w-0">
            {/* Level pill */}
            <div
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-black self-start"
              style={{ background: 'rgba(170,223,79,0.12)', color: '#AADF4F', border: '1px solid rgba(170,223,79,0.2)' }}
            >
              ✦ Level {user.level} — Growing
            </div>

            {/* Plant emoji */}
            <p style={{ fontSize: 64, lineHeight: 1 }}>🌿</p>

            {/* Heading + desc */}
            <div>
              <h2 className="text-2xl font-black" style={{ color: '#F0EFEB' }}>
                Your tree is growing
              </h2>
              <p className="text-sm mt-2 leading-relaxed" style={{ color: 'rgba(255,255,255,0.45)' }}>
                Every completed goal adds a branch. Every season completed makes it bloom further.
                Keep showing up and it will reach full bloom by Winter.
              </p>
            </div>

            {/* XP bar */}
            <div>
              <div
                className="h-2.5 rounded-full overflow-hidden"
                style={{ background: 'rgba(255,255,255,0.07)' }}
              >
                <div
                  className="h-full rounded-full"
                  style={{
                    width: `${xpPct}%`,
                    background: 'linear-gradient(90deg, #AADF4F, #8BC34A)',
                  }}
                />
              </div>
              <div className="flex justify-between mt-1.5">
                <span className="text-[12px] font-bold" style={{ color: '#AADF4F' }}>
                  {user.xp.toLocaleString()} XP
                </span>
                <span className="text-[12px]" style={{ color: 'rgba(255,255,255,0.36)' }}>
                  {xpToNext.toLocaleString()} XP to Level {user.level + 1}
                </span>
              </div>
            </div>
          </div>

          {/* Right: Season progress */}
          <div className="flex-shrink-0" style={{ width: 230 }}>
            <p
              className="text-[11px] font-black tracking-wider mb-4"
              style={{ color: 'rgba(255,255,255,0.36)' }}
            >
              SEASON PROGRESS
            </p>
            <div className="flex flex-col gap-2">
              {SEASON_ORDER.map((key) => {
                const season = seasons.find((s) => s.key === key)!
                const sCfg = SEASONS[key]
                const isActive =
                  season.status === 'current' || season.status === 'overdue'
                const isDone = season.status === 'done'

                return (
                  <div
                    key={key}
                    className="flex items-center justify-between px-3 py-2.5 rounded-xl"
                    style={{
                      background: isActive ? `${sCfg.color}14` : 'rgba(255,255,255,0.03)',
                      border: `1px solid ${isActive ? sCfg.color + '30' : 'transparent'}`,
                    }}
                  >
                    <div className="flex items-center gap-2.5">
                      <span style={{ fontSize: 16 }}>{sCfg.emoji}</span>
                      <div>
                        <p
                          className="text-sm font-black"
                          style={{
                            color: isActive
                              ? sCfg.color
                              : isDone
                              ? 'rgba(255,255,255,0.5)'
                              : 'rgba(255,255,255,0.25)',
                          }}
                        >
                          {sCfg.label}
                        </p>
                        <p
                          className="text-[10px]"
                          style={{ color: 'rgba(255,255,255,0.28)' }}
                        >
                          {sCfg.dateRange}
                        </p>
                      </div>
                    </div>
                    <span
                      className="text-[10px] font-black px-2 py-0.5 rounded-full"
                      style={{
                        background: isActive
                          ? `${sCfg.color}20`
                          : isDone
                          ? 'rgba(170,223,79,0.1)'
                          : 'rgba(255,255,255,0.06)',
                        color: isActive
                          ? sCfg.color
                          : isDone
                          ? '#AADF4F'
                          : 'rgba(255,255,255,0.3)',
                      }}
                    >
                      {isDone ? '✓ Done' : isActive ? `Wk ${season.currentWeek ?? 1}` : 'Soon'}
                    </span>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Life area health */}
      <div
        className="rounded-2xl p-6"
        style={{ background: '#181818', border: '1px solid rgba(255,255,255,0.07)' }}
      >
        <p
          className="text-[11px] font-black tracking-wider mb-6"
          style={{ color: 'rgba(255,255,255,0.36)' }}
        >
          LIFE AREA HEALTH
        </p>
        <div className="flex justify-between">
          {(Object.entries(lifeAreaProgress) as [LifeAreaKey, number][]).map(
            ([key, pct]) => {
              const area = LIFE_AREAS[key]
              const isLow = pct < 25
              const activeCount = currentSeason.milestones.filter(
                (m) => m.lifeAreaKey === key && m.status === 'active'
              ).length
              const subtext = isLow
                ? 'Needs focus'
                : `${activeCount} active goal${activeCount !== 1 ? 's' : ''}`

              return (
                <ArcRing
                  key={key}
                  color={area.color}
                  progress={pct}
                  label={area.label}
                  subtext={subtext}
                  needsFocus={isLow}
                />
              )
            }
          )}
        </div>
      </div>

      {/* Badges */}
      <div
        className="rounded-2xl p-6"
        style={{ background: '#181818', border: '1px solid rgba(255,255,255,0.07)' }}
      >
        <div className="flex items-baseline gap-2 mb-6">
          <h3 className="text-lg font-black" style={{ color: '#F0EFEB' }}>
            Badges
          </h3>
          <p className="text-sm" style={{ color: 'rgba(255,255,255,0.36)' }}>
            {earnedBadges} earned · {badges.length - earnedBadges} locked
          </p>
        </div>
        <div className="flex gap-3 justify-between">
          {badges.map((badge) => (
            <div
              key={badge.id}
              className="flex flex-col items-center gap-2"
              style={{ opacity: badge.earned ? 1 : 0.35 }}
            >
              <div
                className="w-16 h-16 rounded-full flex items-center justify-center"
                style={{
                  background: badge.earned
                    ? 'rgba(255,255,255,0.08)'
                    : 'rgba(255,255,255,0.04)',
                  border: `1px solid ${
                    badge.earned
                      ? 'rgba(255,255,255,0.12)'
                      : 'rgba(255,255,255,0.06)'
                  }`,
                }}
              >
                <span style={{ fontSize: 28 }}>{badge.icon}</span>
              </div>
              <span
                className="text-[10px] font-bold text-center"
                style={{
                  color: badge.earned
                    ? 'rgba(255,255,255,0.55)'
                    : 'rgba(255,255,255,0.25)',
                }}
              >
                {badge.label}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
