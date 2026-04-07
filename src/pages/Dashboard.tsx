import { useAppStore } from '../store/appStore'
import { LIFE_AREAS, SEASONS, SEASON_ORDER } from '../lib/constants'
import type { LifeAreaKey } from '../types'

function LifeAreaRing({
  areaKey,
  progress,
}: {
  areaKey: LifeAreaKey
  progress: number
}) {
  const area = LIFE_AREAS[areaKey]
  const r = 28
  const circ = 2 * Math.PI * r
  const offset = circ - (progress / 100) * circ

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative w-16 h-16">
        <svg className="w-full h-full -rotate-90" viewBox="0 0 72 72">
          <circle
            cx="36"
            cy="36"
            r={r}
            fill="none"
            stroke="rgba(255,255,255,0.06)"
            strokeWidth="6"
          />
          <circle
            cx="36"
            cy="36"
            r={r}
            fill="none"
            stroke={area.color}
            strokeWidth="6"
            strokeDasharray={circ}
            strokeDashoffset={offset}
            strokeLinecap="round"
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center text-lg">
          {area.emoji}
        </div>
      </div>
      <div className="text-center">
        <p className="text-[11px] font-700" style={{ color: area.color }}>
          {area.label}
        </p>
        <p className="text-[10px]" style={{ color: 'rgba(255,255,255,0.36)' }}>
          {progress}%
        </p>
      </div>
    </div>
  )
}

function StatCard({
  label,
  value,
  sub,
  color,
}: {
  label: string
  value: string | number
  sub?: string
  color?: string
}) {
  return (
    <div
      className="rounded-xl p-4 flex flex-col gap-1"
      style={{ background: '#181818', border: '1px solid rgba(255,255,255,0.07)' }}
    >
      <p className="text-xs font-600" style={{ color: 'rgba(255,255,255,0.36)' }}>
        {label}
      </p>
      <p className="text-2xl font-900" style={{ color: color ?? '#F0EFEB' }}>
        {value}
      </p>
      {sub && (
        <p className="text-[11px]" style={{ color: 'rgba(255,255,255,0.36)' }}>
          {sub}
        </p>
      )}
    </div>
  )
}

export function Dashboard() {
  const { user, seasons, badges } = useAppStore()
  const currentSeason = seasons.find((s) => s.key === user.currentSeason)!

  const lifeAreaProgress: Record<LifeAreaKey, number> = {
    physical: 72,
    mind: 45,
    spiritual: 30,
    wealth: 60,
    community: 20,
    family: 55,
  }

  const activeMilestones = currentSeason.milestones.filter(
    (m) => m.status === 'active'
  )
  const completedGoals = currentSeason.milestones.flatMap((m) =>
    m.weeklyGoals.filter((g) => g.done)
  ).length
  const totalGoals = currentSeason.milestones.flatMap((m) => m.weeklyGoals).length

  return (
    <div className="flex gap-6">
      {/* Main content */}
      <div className="flex-1 flex flex-col gap-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-900" style={{ color: '#F0EFEB' }}>
            Hey, {user.name} 👋
          </h1>
          <p className="text-sm mt-1" style={{ color: 'rgba(255,255,255,0.36)' }}>
            Week {currentSeason.currentWeek} of {user.currentSeason} season · {currentSeason.weeksDone} weeks done
          </p>
        </div>

        {/* Stat cards */}
        <div className="grid grid-cols-4 gap-3">
          <StatCard label="Level" value={user.level} sub="Life XP" color="#AADF4F" />
          <StatCard label="XP" value={user.xp.toLocaleString()} sub="2,550 to next" color="#A89EF5" />
          <StatCard label="Streak" value={`${user.streak}d`} sub="Current streak" color="#F5C542" />
          <StatCard
            label="Goals Done"
            value={`${completedGoals}/${totalGoals}`}
            sub="This season"
            color="#5DCAA5"
          />
        </div>

        {/* Life area rings */}
        <div
          className="rounded-xl p-6"
          style={{ background: '#181818', border: '1px solid rgba(255,255,255,0.07)' }}
        >
          <p className="text-sm font-700 mb-5" style={{ color: '#F0EFEB' }}>
            Life Balance
          </p>
          <div className="flex justify-between">
            {(Object.keys(LIFE_AREAS) as LifeAreaKey[]).map((key) => (
              <LifeAreaRing key={key} areaKey={key} progress={lifeAreaProgress[key]} />
            ))}
          </div>
        </div>

        {/* Active milestones */}
        <div
          className="rounded-xl p-5"
          style={{ background: '#181818', border: '1px solid rgba(255,255,255,0.07)' }}
        >
          <p className="text-sm font-700 mb-4" style={{ color: '#F0EFEB' }}>
            Active Milestones
          </p>
          <div className="flex flex-col gap-3">
            {activeMilestones.map((ms) => {
              const area = LIFE_AREAS[ms.lifeAreaKey]
              const done = ms.weeklyGoals.filter((g) => g.done).length
              const total = ms.weeklyGoals.length
              const pct = total > 0 ? Math.round((done / total) * 100) : 0
              return (
                <div
                  key={ms.id}
                  className="rounded-lg p-3 flex items-center gap-3"
                  style={{ background: '#202020' }}
                >
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center text-sm flex-shrink-0"
                    style={{ background: area.bg }}
                  >
                    {area.emoji}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-700 truncate" style={{ color: '#F0EFEB' }}>
                      {ms.title}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <div
                        className="h-1.5 flex-1 rounded-full overflow-hidden"
                        style={{ background: 'rgba(255,255,255,0.06)' }}
                      >
                        <div
                          className="h-full rounded-full"
                          style={{ width: `${pct}%`, background: area.color }}
                        />
                      </div>
                      <span
                        className="text-[10px] font-600 flex-shrink-0"
                        style={{ color: area.color }}
                      >
                        {done}/{total}
                      </span>
                    </div>
                  </div>
                  <span
                    className="text-[10px] font-700 px-2 py-0.5 rounded-full flex-shrink-0"
                    style={{ background: area.bg, color: area.color }}
                  >
                    {area.label}
                  </span>
                </div>
              )
            })}
          </div>
        </div>

        {/* Vision snippet */}
        <div
          className="rounded-xl p-5"
          style={{
            background: 'rgba(170,223,79,0.05)',
            border: '1px solid rgba(170,223,79,0.15)',
          }}
        >
          <p className="text-xs font-700 mb-2" style={{ color: '#AADF4F' }}>
            YOUR VISION
          </p>
          <p className="text-sm leading-relaxed" style={{ color: 'rgba(255,255,255,0.7)' }}>
            "{user.visionStatement}"
          </p>
        </div>
      </div>

      {/* Sidebar */}
      <div className="w-64 flex-shrink-0 flex flex-col gap-4">
        {/* Season sidebar */}
        <div
          className="rounded-xl p-4"
          style={{ background: '#181818', border: '1px solid rgba(255,255,255,0.07)' }}
        >
          <p className="text-xs font-700 mb-3" style={{ color: 'rgba(255,255,255,0.36)' }}>
            YEAR ARC
          </p>
          <div className="flex flex-col gap-2">
            {SEASON_ORDER.map((key) => {
              const season = seasons.find((s) => s.key === key)!
              const cfg = SEASONS[key]
              const isCurrent = season.status === 'current'
              return (
                <div
                  key={key}
                  className="rounded-lg p-3"
                  style={{
                    background: isCurrent ? `${cfg.color}11` : '#202020',
                    border: `1px solid ${isCurrent ? cfg.color + '33' : 'transparent'}`,
                  }}
                >
                  <div className="flex justify-between items-center">
                    <span
                      className="text-xs font-700 capitalize"
                      style={{ color: isCurrent ? cfg.color : 'rgba(255,255,255,0.36)' }}
                    >
                      {cfg.label}
                    </span>
                    <span
                      className="text-[10px]"
                      style={{ color: 'rgba(255,255,255,0.36)' }}
                    >
                      {season.status === 'done'
                        ? 'Done'
                        : season.status === 'current'
                        ? `Wk ${season.currentWeek}`
                        : 'Soon'}
                    </span>
                  </div>
                  <div
                    className="mt-2 h-1 rounded-full overflow-hidden"
                    style={{ background: 'rgba(255,255,255,0.06)' }}
                  >
                    <div
                      className="h-full rounded-full transition-all"
                      style={{
                        width: `${Math.round((season.weeksDone / 12) * 100)}%`,
                        background: cfg.color,
                      }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Badges */}
        <div
          className="rounded-xl p-4"
          style={{ background: '#181818', border: '1px solid rgba(255,255,255,0.07)' }}
        >
          <p className="text-xs font-700 mb-3" style={{ color: 'rgba(255,255,255,0.36)' }}>
            BADGES
          </p>
          <div className="grid grid-cols-3 gap-2">
            {badges.map((badge) => (
              <div
                key={badge.id}
                className="flex flex-col items-center gap-1 p-2 rounded-lg"
                style={{
                  background: badge.earned ? '#202020' : 'rgba(255,255,255,0.02)',
                  opacity: badge.earned ? 1 : 0.35,
                }}
                title={badge.label}
              >
                <span className="text-xl">{badge.icon}</span>
                <span
                  className="text-[9px] font-700 text-center leading-tight"
                  style={{ color: 'rgba(255,255,255,0.5)' }}
                >
                  {badge.label}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
