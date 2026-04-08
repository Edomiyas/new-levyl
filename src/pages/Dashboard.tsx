import { useAppStore } from '../store/appStore'
import { LIFE_AREAS, SEASONS, SEASON_ORDER } from '../lib/constants'
import type { LifeAreaKey } from '../types'

// ─── Life Area Ring ───────────────────────────────────────────────────────────

function LifeAreaRing({ areaKey, progress }: { areaKey: LifeAreaKey; progress: number }) {
  const area = LIFE_AREAS[areaKey]
  const r = 28
  const circ = 2 * Math.PI * r
  const offset = circ - (progress / 100) * circ

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative" style={{ width: 72, height: 72 }}>
        <svg width="72" height="72" viewBox="0 0 72 72" style={{ transform: 'rotate(-90deg)' }}>
          <circle cx="36" cy="36" r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="6" />
          <circle
            cx="36" cy="36" r={r} fill="none"
            stroke={area.color} strokeWidth="6"
            strokeDasharray={circ} strokeDashoffset={offset}
            strokeLinecap="round"
          />
        </svg>
        <div
          className="absolute inset-0 flex items-center justify-center"
          style={{ fontSize: 18 }}
        >
          {area.emoji}
        </div>
      </div>
      <div className="text-center">
        <p className="text-[11px] font-bold" style={{ color: area.color }}>{area.label}</p>
        <p className="text-[10px]" style={{ color: 'rgba(255,255,255,0.36)' }}>{progress}%</p>
      </div>
    </div>
  )
}

// ─── Life Tree SVG ────────────────────────────────────────────────────────────

function LifeTree({ level, badges }: { level: number; badges: { earned: boolean }[] }) {
  const earnedCount = badges.filter((b) => b.earned).length
  const fruitColors = [
    LIFE_AREAS.physical.color,
    LIFE_AREAS.mind.color,
    LIFE_AREAS.spiritual.color,
    LIFE_AREAS.wealth.color,
    LIFE_AREAS.community.color,
    LIFE_AREAS.family.color,
  ]
  const fruitPositions = [
    { cx: 52, cy: 60 }, { cx: 88, cy: 55 }, { cx: 42, cy: 78 },
    { cx: 95, cy: 72 }, { cx: 68, cy: 48 }, { cx: 58, cy: 92 },
  ]

  return (
    <svg viewBox="0 0 140 180" width="120" height="155" style={{ overflow: 'visible' }}>
      {/* Glow — outer halo */}
      <ellipse cx="70" cy="80" rx="65" ry="70" fill="#AADF4F" opacity="0.03" />
      {/* Glow — mid */}
      <ellipse cx="70" cy="80" rx="52" ry="57" fill="#AADF4F" opacity="0.05" />
      {/* Glow — inner */}
      <ellipse cx="70" cy="80" rx="38" ry="42" fill="#AADF4F" opacity="0.07" />
      {/* Trunk */}
      <rect x="62" y="120" width="16" height="55" rx="6" fill="#6D4C41" />
      {/* Left branch */}
      <path d="M70 105 Q48 95 38 78" stroke="#6D4C41" strokeWidth="5" fill="none" strokeLinecap="round" />
      {/* Right branch */}
      <path d="M70 105 Q92 95 102 78" stroke="#6D4C41" strokeWidth="5" fill="none" strokeLinecap="round" />
      {/* Foliage — bottom layer */}
      <ellipse cx="70" cy="80" rx="55" ry="60" fill="#AADF4F" opacity="0.10" />
      {/* Foliage — mid layer */}
      <ellipse cx="70" cy="72" rx="42" ry="48" fill="#AADF4F" opacity="0.20" />
      {/* Foliage — top layer */}
      <ellipse cx="70" cy="65" rx="30" ry="36" fill="#AADF4F" opacity="0.35" />
      {/* Fruits — one per earned badge */}
      {fruitPositions.map((pos, i) =>
        i < earnedCount && level >= 3 + i * 2 ? (
          <circle key={i} cx={pos.cx} cy={pos.cy} r={5} fill={fruitColors[i]} opacity="0.9" />
        ) : null
      )}
    </svg>
  )
}

// ─── Stat Chip ────────────────────────────────────────────────────────────────

function StatChip({
  icon,
  label,
  value,
  color,
}: {
  icon: string
  label: string
  value: string
  color: string
}) {
  return (
    <div
      className="flex items-center gap-2 px-3 py-1.5 rounded-full"
      style={{ background: `${color}14`, border: `1px solid ${color}30` }}
    >
      <span style={{ fontSize: 13 }}>{icon}</span>
      <div>
        <p className="text-[9px] font-bold leading-none" style={{ color: 'rgba(255,255,255,0.4)' }}>
          {label}
        </p>
        <p className="text-[12px] font-black leading-tight" style={{ color }}>
          {value}
        </p>
      </div>
    </div>
  )
}

// ─── Dashboard ────────────────────────────────────────────────────────────────

export function Dashboard() {
  const { user, seasons, badges } = useAppStore()
  const currentSeason = seasons.find((s) => s.key === user.currentSeason)!
  const cfg = SEASONS[user.currentSeason]
  const xpToNext = 3000

  const lifeAreaProgress: Record<LifeAreaKey, number> = {
    physical: 72,
    mind: 45,
    spiritual: 30,
    wealth: 60,
    community: 20,
    family: 55,
  }

  const activeMilestones = currentSeason.milestones.filter((m) => m.status === 'active')

  const completedGoals = currentSeason.milestones.flatMap((m) =>
    m.weeklyGoals.filter((g) => g.done)
  ).length
  const totalGoals = currentSeason.milestones.flatMap((m) => m.weeklyGoals).length

  return (
    <div className="flex gap-6">
      {/* ── LEFT MAIN ── */}
      <div className="flex-1 flex flex-col gap-6 min-w-0">

        {/* HERO CARD */}
        <div
          className="rounded-2xl p-6"
          style={{ background: '#181818', border: '1px solid rgba(255,255,255,0.07)' }}
        >
          <div className="flex items-start justify-between gap-4">
            {/* Left: greeting + stats */}
            <div className="flex-1 min-w-0">
              <h1 className="text-3xl font-black" style={{ color: '#F0EFEB' }}>
                Hey {user.name} 👋
              </h1>
              <p className="text-sm mt-1 mb-5" style={{ color: 'rgba(255,255,255,0.36)' }}>
                Week {currentSeason.currentWeek} of{' '}
                <span className="font-bold capitalize" style={{ color: cfg.color }}>
                  {cfg.label}
                </span>{' '}
                season · {currentSeason.weeksDone} weeks done
              </p>

              {/* Stat chips */}
              <div className="flex flex-wrap gap-2">
                <StatChip icon="⚡" label="LEVEL" value={`LV ${user.level}`} color="#AADF4F" />
                <StatChip
                  icon="✨"
                  label="XP"
                  value={user.xp.toLocaleString()}
                  color="#A89EF5"
                />
                <StatChip icon="🔥" label="STREAK" value={`${user.streak}d`} color="#F5C542" />
                <StatChip
                  icon="🎯"
                  label="GOALS"
                  value={`${completedGoals}/${totalGoals}`}
                  color="#5DCAA5"
                />
              </div>

              {/* XP bar */}
              <div className="flex items-center gap-3 mt-5">
                <span
                  className="text-xs font-black px-2 py-0.5 rounded-md flex-shrink-0"
                  style={{ background: 'rgba(170,223,79,0.15)', color: '#AADF4F' }}
                >
                  LV {user.level}
                </span>
                <div className="flex-1">
                  <div
                    className="h-2 rounded-full overflow-hidden"
                    style={{ background: 'rgba(255,255,255,0.07)' }}
                  >
                    <div
                      className="h-full rounded-full transition-all"
                      style={{
                        width: `${Math.round((user.xp / xpToNext) * 100)}%`,
                        background: 'linear-gradient(90deg, #AADF4F, #8BC34A)',
                      }}
                    />
                  </div>
                </div>
                <span className="text-[11px] font-bold flex-shrink-0" style={{ color: 'rgba(255,255,255,0.36)' }}>
                  {user.xp.toLocaleString()} / {xpToNext.toLocaleString()} XP
                </span>
              </div>
            </div>

            {/* Right: Life Tree */}
            <div className="flex-shrink-0 flex items-center justify-center" style={{ width: 120 }}>
              <LifeTree level={user.level} badges={badges} />
            </div>
          </div>
        </div>

        {/* LIFE BALANCE */}
        <div
          className="rounded-xl p-5"
          style={{ background: '#181818', border: '1px solid rgba(255,255,255,0.07)' }}
        >
          <p className="text-sm font-bold mb-5" style={{ color: '#F0EFEB' }}>
            Life Balance
          </p>
          <div className="flex justify-between">
            {(Object.keys(LIFE_AREAS) as LifeAreaKey[]).map((key) => (
              <LifeAreaRing key={key} areaKey={key} progress={lifeAreaProgress[key]} />
            ))}
          </div>
        </div>

        {/* ACTIVE MILESTONES */}
        <div
          className="rounded-xl p-5"
          style={{ background: '#181818', border: '1px solid rgba(255,255,255,0.07)' }}
        >
          <p className="text-sm font-bold mb-4" style={{ color: '#F0EFEB' }}>
            Active Milestones
          </p>
          {activeMilestones.length === 0 ? (
            <p className="text-sm text-center py-4" style={{ color: 'rgba(255,255,255,0.25)' }}>
              No active milestones this season
            </p>
          ) : (
            <div className="flex flex-col gap-2.5">
              {activeMilestones.map((ms) => {
                const area = LIFE_AREAS[ms.lifeAreaKey]
                const done = ms.weeklyGoals.filter((g) => g.done).length
                const total = ms.weeklyGoals.length
                const pct = total > 0 ? Math.round((done / total) * 100) : 0
                return (
                  <div
                    key={ms.id}
                    className="rounded-xl p-3 flex items-center gap-3"
                    style={{ background: '#202020' }}
                  >
                    <div
                      className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
                      style={{ background: area.bg, fontSize: 16 }}
                    >
                      {area.emoji}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold truncate" style={{ color: '#F0EFEB' }}>
                        {ms.title}
                      </p>
                      <div className="flex items-center gap-2 mt-1.5">
                        <div
                          className="h-1.5 flex-1 rounded-full overflow-hidden"
                          style={{ background: 'rgba(255,255,255,0.06)' }}
                        >
                          <div
                            className="h-full rounded-full transition-all"
                            style={{ width: `${pct}%`, background: area.color }}
                          />
                        </div>
                        <span
                          className="text-[10px] font-bold flex-shrink-0"
                          style={{ color: area.color }}
                        >
                          {pct}%
                        </span>
                      </div>
                    </div>
                    <span
                      className="text-[10px] font-bold px-2 py-1 rounded-full flex-shrink-0"
                      style={{ background: area.bg, color: area.color }}
                    >
                      {area.label}
                    </span>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* VISION SNIPPET */}
        <div
          className="rounded-xl p-5"
          style={{
            background: 'rgba(170,223,79,0.05)',
            border: '1px solid rgba(170,223,79,0.15)',
          }}
        >
          <p className="text-xs font-black mb-2.5 tracking-wider" style={{ color: '#AADF4F' }}>
            YOUR VISION
          </p>
          <p className="text-sm leading-relaxed italic" style={{ color: 'rgba(255,255,255,0.7)' }}>
            "{user.visionStatement}"
          </p>
        </div>
      </div>

      {/* ── RIGHT SIDEBAR ── */}
      <div className="flex-shrink-0 flex flex-col gap-4" style={{ width: 288 }}>

        {/* YEAR ARC */}
        <div
          className="rounded-xl p-4"
          style={{ background: '#181818', border: '1px solid rgba(255,255,255,0.07)' }}
        >
          <p className="text-xs font-black mb-3 tracking-wider" style={{ color: 'rgba(255,255,255,0.36)' }}>
            YEAR ARC
          </p>
          <div className="flex flex-col gap-2">
            {SEASON_ORDER.map((key) => {
              const season = seasons.find((s) => s.key === key)!
              const sCfg = SEASONS[key]
              const isCurrent = season.status === 'current'
              const isDone = season.status === 'done'

              return (
                <div
                  key={key}
                  className="rounded-lg p-3"
                  style={{
                    background: isCurrent ? `${sCfg.color}12` : '#202020',
                    border: `1px solid ${isCurrent ? sCfg.color + '35' : 'transparent'}`,
                  }}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span
                      className="text-xs font-bold capitalize"
                      style={{ color: isCurrent ? sCfg.color : isDone ? 'rgba(255,255,255,0.5)' : 'rgba(255,255,255,0.25)' }}
                    >
                      {sCfg.label}
                    </span>
                    <span
                      className="text-[10px] font-bold px-1.5 py-0.5 rounded"
                      style={{
                        background: isCurrent ? `${sCfg.color}20` : 'transparent',
                        color: isCurrent ? sCfg.color : 'rgba(255,255,255,0.3)',
                      }}
                    >
                      {isDone ? 'Done ✓' : isCurrent ? `Wk ${season.currentWeek}` : 'Soon'}
                    </span>
                  </div>
                  <div
                    className="h-1 rounded-full overflow-hidden"
                    style={{ background: 'rgba(255,255,255,0.06)' }}
                  >
                    <div
                      className="h-full rounded-full transition-all"
                      style={{
                        width: `${Math.round((season.weeksDone / 12) * 100)}%`,
                        background: sCfg.color,
                        opacity: isCurrent || isDone ? 1 : 0.4,
                      }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* BADGES */}
        <div
          className="rounded-xl p-4"
          style={{ background: '#181818', border: '1px solid rgba(255,255,255,0.07)' }}
        >
          <p className="text-xs font-black mb-3 tracking-wider" style={{ color: 'rgba(255,255,255,0.36)' }}>
            BADGES
          </p>
          <div className="grid grid-cols-3 gap-2">
            {badges.map((badge) => (
              <div
                key={badge.id}
                className="flex flex-col items-center gap-1.5 p-2.5 rounded-xl transition-all"
                style={{
                  background: badge.earned ? '#202020' : 'rgba(255,255,255,0.02)',
                  border: badge.earned
                    ? '1px solid rgba(255,255,255,0.08)'
                    : '1px solid rgba(255,255,255,0.03)',
                  opacity: badge.earned ? 1 : 0.35,
                }}
                title={badge.label}
              >
                <span style={{ fontSize: 22 }}>{badge.icon}</span>
                <span
                  className="text-[9px] font-bold text-center leading-tight"
                  style={{ color: badge.earned ? 'rgba(255,255,255,0.55)' : 'rgba(255,255,255,0.3)' }}
                >
                  {badge.label}
                </span>
              </div>
            ))}
          </div>
          <p className="text-[10px] mt-3 text-center" style={{ color: 'rgba(255,255,255,0.2)' }}>
            {badges.filter((b) => b.earned).length}/{badges.length} earned
          </p>
        </div>
      </div>
    </div>
  )
}
