import { useState } from 'react'
import { Plus, X, Wand2, Check } from 'lucide-react'
import { useAppStore } from '../store/appStore'
import { LIFE_AREAS, SEASONS, SEASON_ORDER } from '../lib/constants'
import type { LifeAreaKey, Milestone } from '../types'

const LIFE_AREA_KEYS = Object.keys(LIFE_AREAS) as LifeAreaKey[]

// ─── Add Milestone Modal ──────────────────────────────────────────────────────

function AddMilestoneModal({
  onClose,
  onSubmit,
  currentSeasonKey,
  currentWeek,
}: {
  onClose: () => void
  onSubmit: (lifeAreaKey: LifeAreaKey, title: string) => void
  currentSeasonKey: string
  currentWeek: number | null
}) {
  const [selectedArea, setSelectedArea] = useState<LifeAreaKey>('physical')
  const [title, setTitle] = useState('')

  const cfg = SEASONS[currentSeasonKey as keyof typeof SEASONS]
  const canSubmit = title.trim().length > 0

  const handleSubmit = () => {
    if (!canSubmit) return
    onSubmit(selectedArea, title.trim())
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.8)' }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        className="w-full rounded-2xl p-6 flex flex-col gap-5"
        style={{
          maxWidth: 440,
          background: '#181818',
          border: '1px solid rgba(255,255,255,0.1)',
        }}
      >
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-lg font-black" style={{ color: '#F0EFEB' }}>
              Add Milestone
            </h2>
            <p className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.36)' }}>
              Locked to{' '}
              <span className="font-black capitalize" style={{ color: cfg.color }}>
                {cfg.label}
              </span>{' '}
              season
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

        {/* Life area picker */}
        <div>
          <label className="text-[11px] font-black tracking-wider block mb-2" style={{ color: 'rgba(255,255,255,0.36)' }}>
            LIFE AREA
          </label>
          <div className="grid grid-cols-3 gap-2">
            {LIFE_AREA_KEYS.map((key) => {
              const area = LIFE_AREAS[key]
              const isSelected = selectedArea === key
              return (
                <button
                  key={key}
                  onClick={() => setSelectedArea(key)}
                  className="flex items-center gap-2 p-2.5 rounded-xl transition-all"
                  style={{
                    background: isSelected ? area.bg : 'rgba(255,255,255,0.03)',
                    border: `1px solid ${isSelected ? area.color + '55' : 'rgba(255,255,255,0.06)'}`,
                  }}
                >
                  <span style={{ fontSize: 15 }}>{area.emoji}</span>
                  <span
                    className="text-xs font-bold"
                    style={{ color: isSelected ? area.color : 'rgba(255,255,255,0.4)' }}
                  >
                    {area.label}
                  </span>
                </button>
              )
            })}
          </div>
        </div>

        {/* Title input */}
        <div>
          <label className="text-[11px] font-black tracking-wider block mb-2" style={{ color: 'rgba(255,255,255,0.36)' }}>
            MILESTONE TITLE
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
            placeholder="e.g. Run a marathon under 4 hours"
            autoFocus
            className="w-full px-4 py-3 rounded-xl text-sm outline-none transition-all"
            style={{
              background: '#202020',
              border: `1px solid ${title ? 'rgba(255,255,255,0.12)' : 'rgba(255,255,255,0.07)'}`,
              color: '#F0EFEB',
              fontFamily: 'Nunito, sans-serif',
            }}
          />
        </div>

        {/* Season info box */}
        <div
          className="rounded-xl p-3 flex items-center gap-2.5"
          style={{ background: `${cfg.color}10`, border: `1px solid ${cfg.color}20` }}
        >
          <span style={{ fontSize: 16 }}>📅</span>
          <p className="text-xs" style={{ color: 'rgba(255,255,255,0.5)' }}>
            Adding to{' '}
            <span className="font-black capitalize" style={{ color: cfg.color }}>
              {cfg.label}
            </span>
            {' '}· Week {currentWeek ?? 1} of 12
          </p>
        </div>

        {/* Submit */}
        <button
          onClick={handleSubmit}
          disabled={!canSubmit}
          className="w-full py-3 rounded-xl text-sm font-black flex items-center justify-center gap-2 transition-all"
          style={{
            background: canSubmit ? '#AADF4F' : 'rgba(255,255,255,0.06)',
            color: canSubmit ? '#0F0F0F' : 'rgba(255,255,255,0.2)',
            cursor: canSubmit ? 'pointer' : 'not-allowed',
          }}
        >
          {canSubmit && <Check size={15} />}
          Add Milestone
        </button>
      </div>
    </div>
  )
}

// ─── Vision Page ──────────────────────────────────────────────────────────────

export function Vision() {
  const { user, seasons, updateVision, addMilestone } = useAppStore()
  const [visionText, setVisionText] = useState(user.visionStatement)
  const [isDirty, setIsDirty] = useState(false)
  const [showModal, setShowModal] = useState(false)

  const currentSeason = seasons.find((s) => s.key === user.currentSeason)!

  const totalMilestones = seasons.flatMap((s) => s.milestones).length
  const doneMilestones = seasons
    .flatMap((s) => s.milestones)
    .filter((m) => m.status === 'done').length

  const handleSave = () => {
    updateVision(visionText)
    setIsDirty(false)
  }

  const handleAddMilestone = (lifeAreaKey: LifeAreaKey, title: string) => {
    const ms: Milestone = {
      id: `ms-${Date.now()}`,
      seasonKey: user.currentSeason,
      lifeAreaKey,
      title,
      status: 'not_started',
      weeklyGoals: [],
    }
    addMilestone(ms)
    setShowModal(false)
  }

  return (
    <div className="flex flex-col gap-8" style={{ maxWidth: '48rem' }}>

      {/* ── HEADER ── */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black" style={{ color: '#F0EFEB' }}>
            Vision
          </h1>
          <p className="text-sm mt-1" style={{ color: 'rgba(255,255,255,0.36)' }}>
            Your north star — revisit often
          </p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-black transition-all flex-shrink-0"
          style={{
            background: '#AADF4F',
            color: '#0F0F0F',
            boxShadow: '0 4px 16px rgba(170,223,79,0.25)',
          }}
          onMouseEnter={(e) => ((e.currentTarget as HTMLButtonElement).style.opacity = '0.9')}
          onMouseLeave={(e) => ((e.currentTarget as HTMLButtonElement).style.opacity = '1')}
        >
          <Plus size={16} />
          Add Milestone
        </button>
      </div>

      {/* ── VISION TEXTAREA ── */}
      <div
        className="rounded-xl overflow-hidden"
        style={{ border: '1px solid rgba(255,255,255,0.07)' }}
      >
        <div
          className="px-5 py-3 flex items-center justify-between"
          style={{ background: '#181818', borderBottom: '1px solid rgba(255,255,255,0.07)' }}
        >
          <p className="text-[11px] font-black tracking-wider" style={{ color: 'rgba(255,255,255,0.36)' }}>
            VISION STATEMENT
          </p>
          <div className="flex items-center gap-2">
            <button
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all"
              style={{ background: 'rgba(168,158,245,0.12)', color: '#A89EF5' }}
              onMouseEnter={(e) => ((e.currentTarget as HTMLButtonElement).style.opacity = '0.8')}
              onMouseLeave={(e) => ((e.currentTarget as HTMLButtonElement).style.opacity = '1')}
            >
              <Wand2 size={12} />
              Generate with AI
            </button>
            {isDirty && (
              <button
                onClick={handleSave}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-black transition-all"
                style={{ background: '#AADF4F', color: '#0F0F0F' }}
              >
                <Check size={12} />
                Save
              </button>
            )}
          </div>
        </div>
        <textarea
          value={visionText}
          onChange={(e) => {
            setVisionText(e.target.value)
            setIsDirty(true)
          }}
          rows={5}
          className="w-full p-5 resize-none text-sm leading-relaxed outline-none"
          style={{
            background: '#181818',
            color: '#F0EFEB',
            fontFamily: 'Nunito, sans-serif',
          }}
          placeholder="Write your vision for life here… Who do you want to become? What does your ideal life look like? What will you have built in 10 years?"
        />
      </div>

      {/* ── YEAR ARC GRID ── */}
      <div>
        <p className="text-[11px] font-black tracking-wider mb-3" style={{ color: 'rgba(255,255,255,0.36)' }}>
          YEAR ARC
        </p>
        <div className="grid grid-cols-4 gap-3">
          {SEASON_ORDER.map((key) => {
            const season = seasons.find((s) => s.key === key)!
            const cfg = SEASONS[key]
            const isCurrent = season.status === 'current'
            const isDone = season.status === 'done'
            const msDone = season.milestones.filter((m) => m.status === 'done').length
            const msTotal = season.milestones.length
            const pct = Math.round((season.weeksDone / 12) * 100)

            return (
              <div
                key={key}
                className="rounded-xl p-4 flex flex-col gap-3"
                style={{
                  background: isCurrent ? `${cfg.color}10` : '#181818',
                  border: `1px solid ${isCurrent ? cfg.color + '30' : 'rgba(255,255,255,0.07)'}`,
                }}
              >
                <div className="flex items-center justify-between">
                  <p
                    className="text-sm font-black capitalize"
                    style={{
                      color: isCurrent ? cfg.color : isDone ? 'rgba(255,255,255,0.5)' : 'rgba(255,255,255,0.25)',
                    }}
                  >
                    {cfg.label}
                  </p>
                  {isCurrent && (
                    <div
                      className="w-2 h-2 rounded-full"
                      style={{
                        background: cfg.color,
                        boxShadow: `0 0 6px ${cfg.color}`,
                      }}
                    />
                  )}
                  {isDone && (
                    <span style={{ fontSize: 13 }}>✓</span>
                  )}
                </div>

                <div>
                  <div
                    className="h-1.5 rounded-full overflow-hidden mb-1.5"
                    style={{ background: 'rgba(255,255,255,0.06)' }}
                  >
                    <div
                      className="h-full rounded-full transition-all"
                      style={{
                        width: `${pct}%`,
                        background: cfg.color,
                        opacity: isCurrent || isDone ? 1 : 0.4,
                      }}
                    />
                  </div>
                  <p className="text-[10px]" style={{ color: 'rgba(255,255,255,0.3)' }}>
                    {season.weeksDone}/12 weeks
                  </p>
                </div>

                <div>
                  <p
                    className="text-2xl font-black"
                    style={{ color: isCurrent ? cfg.color : isDone ? '#F0EFEB' : 'rgba(255,255,255,0.25)' }}
                  >
                    {msTotal}
                  </p>
                  <p className="text-[10px]" style={{ color: 'rgba(255,255,255,0.3)' }}>
                    milestones · {msDone} done
                  </p>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* ── ANNUAL PROGRESS ── */}
      <div
        className="rounded-xl p-5"
        style={{ background: '#181818', border: '1px solid rgba(255,255,255,0.07)' }}
      >
        <div className="flex justify-between items-center mb-5">
          <p className="text-sm font-bold" style={{ color: '#F0EFEB' }}>
            Annual Progress
          </p>
          <p className="text-sm font-black" style={{ color: '#AADF4F' }}>
            {doneMilestones}/{totalMilestones} milestones
          </p>
        </div>

        <div className="flex flex-col gap-3.5">
          {LIFE_AREA_KEYS.map((key) => {
            const area = LIFE_AREAS[key]
            const allMs = seasons.flatMap((s) =>
              s.milestones.filter((m) => m.lifeAreaKey === key)
            )
            const doneMs = allMs.filter((m) => m.status === 'done').length
            const pct = allMs.length > 0 ? Math.round((doneMs / allMs.length) * 100) : 0

            return (
              <div key={key} className="flex items-center gap-3">
                <span className="flex-shrink-0" style={{ fontSize: 14, width: 20 }}>
                  {area.emoji}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-center mb-1.5">
                    <span className="text-xs font-bold" style={{ color: 'rgba(255,255,255,0.5)' }}>
                      {area.label}
                    </span>
                    <span className="text-xs font-black" style={{ color: area.color }}>
                      {doneMs}/{allMs.length}
                    </span>
                  </div>
                  <div
                    className="h-1.5 rounded-full overflow-hidden"
                    style={{ background: 'rgba(255,255,255,0.06)' }}
                  >
                    <div
                      className="h-full rounded-full transition-all"
                      style={{
                        width: `${pct}%`,
                        background: area.color,
                      }}
                    />
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* ── ADD MILESTONE MODAL ── */}
      {showModal && (
        <AddMilestoneModal
          onClose={() => setShowModal(false)}
          onSubmit={handleAddMilestone}
          currentSeasonKey={user.currentSeason}
          currentWeek={currentSeason.currentWeek}
        />
      )}
    </div>
  )
}
