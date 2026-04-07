import { useState } from 'react'
import { Plus, X, Wand2 } from 'lucide-react'
import { useAppStore } from '../store/appStore'
import { LIFE_AREAS, SEASONS, SEASON_ORDER } from '../lib/constants'
import type { LifeAreaKey, Milestone } from '../types'

interface AddGoalForm {
  lifeAreaKey: LifeAreaKey
  title: string
}

const LIFE_AREA_KEYS = Object.keys(LIFE_AREAS) as LifeAreaKey[]

export function Vision() {
  const { user, seasons, updateVision, addMilestone } = useAppStore()
  const [visionText, setVisionText] = useState(user.visionStatement)
  const [isDirty, setIsDirty] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState<AddGoalForm>({
    lifeAreaKey: 'physical',
    title: '',
  })

  const currentSeason = seasons.find((s) => s.key === user.currentSeason)!

  const handleSaveVision = () => {
    updateVision(visionText)
    setIsDirty(false)
  }

  const handleAddMilestone = () => {
    if (!form.title.trim()) return
    const ms: Milestone = {
      id: `ms-${Date.now()}`,
      seasonKey: user.currentSeason,
      lifeAreaKey: form.lifeAreaKey,
      title: form.title.trim(),
      status: 'not_started',
      weeklyGoals: [],
    }
    addMilestone(ms)
    setForm({ lifeAreaKey: 'physical', title: '' })
    setShowModal(false)
  }

  const totalMilestones = seasons.flatMap((s) => s.milestones).length
  const doneMilestones = seasons
    .flatMap((s) => s.milestones)
    .filter((m) => m.status === 'done').length

  return (
    <div className="flex flex-col gap-8 max-w-3xl">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-900" style={{ color: '#F0EFEB' }}>
            Vision
          </h1>
          <p className="text-sm mt-1" style={{ color: 'rgba(255,255,255,0.36)' }}>
            Your north star — revisit often
          </p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-700 transition-all hover:opacity-90"
          style={{ background: '#AADF4F', color: '#0F0F0F' }}
        >
          <Plus size={16} />
          Add Milestone
        </button>
      </div>

      {/* Vision textarea */}
      <div
        className="rounded-xl overflow-hidden"
        style={{ border: '1px solid rgba(255,255,255,0.07)' }}
      >
        <div
          className="px-5 py-3 flex items-center justify-between"
          style={{ background: '#181818', borderBottom: '1px solid rgba(255,255,255,0.07)' }}
        >
          <p className="text-xs font-700" style={{ color: 'rgba(255,255,255,0.36)' }}>
            VISION STATEMENT
          </p>
          <div className="flex items-center gap-2">
            <button
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-700 transition-all hover:opacity-80"
              style={{ background: 'rgba(168,158,245,0.12)', color: '#A89EF5' }}
            >
              <Wand2 size={12} />
              Generate with AI
            </button>
            {isDirty && (
              <button
                onClick={handleSaveVision}
                className="px-3 py-1.5 rounded-lg text-xs font-700 transition-all hover:opacity-90"
                style={{ background: '#AADF4F', color: '#0F0F0F' }}
              >
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
          placeholder="Write your vision for life here… Who do you want to become? What does your ideal life look like?"
        />
      </div>

      {/* Year arc cards */}
      <div>
        <p className="text-xs font-700 mb-3" style={{ color: 'rgba(255,255,255,0.36)' }}>
          YEAR ARC
        </p>
        <div className="grid grid-cols-4 gap-3">
          {SEASON_ORDER.map((key) => {
            const season = seasons.find((s) => s.key === key)!
            const cfg = SEASONS[key]
            const isCurrent = season.status === 'current'
            const msDone = season.milestones.filter((m) => m.status === 'done').length
            const msTotal = season.milestones.length

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
                    className="text-sm font-800 capitalize"
                    style={{ color: isCurrent ? cfg.color : 'rgba(255,255,255,0.5)' }}
                  >
                    {cfg.label}
                  </p>
                  {isCurrent && (
                    <div
                      className="w-2 h-2 rounded-full"
                      style={{ background: cfg.color }}
                    />
                  )}
                </div>
                <div>
                  <div
                    className="h-1.5 rounded-full overflow-hidden mb-1.5"
                    style={{ background: 'rgba(255,255,255,0.06)' }}
                  >
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${Math.round((season.weeksDone / 12) * 100)}%`,
                        background: cfg.color,
                      }}
                    />
                  </div>
                  <p className="text-[10px]" style={{ color: 'rgba(255,255,255,0.3)' }}>
                    {season.weeksDone}/12 weeks
                  </p>
                </div>
                <div>
                  <p className="text-xl font-900" style={{ color: isCurrent ? cfg.color : '#F0EFEB' }}>
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

      {/* Annual progress */}
      <div
        className="rounded-xl p-5"
        style={{ background: '#181818', border: '1px solid rgba(255,255,255,0.07)' }}
      >
        <div className="flex justify-between items-center mb-4">
          <p className="text-sm font-700" style={{ color: '#F0EFEB' }}>
            Annual Progress
          </p>
          <p className="text-sm font-700" style={{ color: '#AADF4F' }}>
            {doneMilestones}/{totalMilestones} milestones
          </p>
        </div>

        {/* Life area breakdown */}
        <div className="flex flex-col gap-2.5">
          {LIFE_AREA_KEYS.map((key) => {
            const area = LIFE_AREAS[key]
            const allMs = seasons.flatMap((s) => s.milestones.filter((m) => m.lifeAreaKey === key))
            const doneMs = allMs.filter((m) => m.status === 'done').length
            const pct = allMs.length > 0 ? Math.round((doneMs / allMs.length) * 100) : 0

            return (
              <div key={key} className="flex items-center gap-3">
                <span className="w-5 text-sm">{area.emoji}</span>
                <div className="flex-1">
                  <div className="flex justify-between mb-1">
                    <span className="text-xs font-600" style={{ color: 'rgba(255,255,255,0.5)' }}>
                      {area.label}
                    </span>
                    <span className="text-xs font-700" style={{ color: area.color }}>
                      {doneMs}/{allMs.length}
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
              </div>
            )
          })}
        </div>
      </div>

      {/* Add Milestone Modal */}
      {showModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.7)' }}
          onClick={(e) => e.target === e.currentTarget && setShowModal(false)}
        >
          <div
            className="w-full max-w-md rounded-2xl p-6 flex flex-col gap-5"
            style={{ background: '#181818', border: '1px solid rgba(255,255,255,0.1)' }}
          >
            {/* Modal header */}
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-800" style={{ color: '#F0EFEB' }}>
                  Add Milestone
                </h2>
                <p className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.36)' }}>
                  Locked to{' '}
                  <span
                    className="font-700 capitalize"
                    style={{ color: SEASONS[user.currentSeason].color }}
                  >
                    {user.currentSeason}
                  </span>{' '}
                  season
                </p>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="p-1.5 rounded-lg hover:bg-white/5 transition-colors"
              >
                <X size={18} style={{ color: 'rgba(255,255,255,0.4)' }} />
              </button>
            </div>

            {/* Life area picker */}
            <div>
              <label
                className="text-xs font-700 block mb-2"
                style={{ color: 'rgba(255,255,255,0.36)' }}
              >
                LIFE AREA
              </label>
              <div className="grid grid-cols-3 gap-2">
                {LIFE_AREA_KEYS.map((key) => {
                  const area = LIFE_AREAS[key]
                  const isSelected = form.lifeAreaKey === key
                  return (
                    <button
                      key={key}
                      onClick={() => setForm((f) => ({ ...f, lifeAreaKey: key }))}
                      className="flex items-center gap-2 p-2.5 rounded-lg transition-all"
                      style={{
                        background: isSelected ? area.bg : 'rgba(255,255,255,0.03)',
                        border: `1px solid ${isSelected ? area.color + '50' : 'rgba(255,255,255,0.06)'}`,
                      }}
                    >
                      <span>{area.emoji}</span>
                      <span
                        className="text-xs font-700"
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
              <label
                className="text-xs font-700 block mb-2"
                style={{ color: 'rgba(255,255,255,0.36)' }}
              >
                MILESTONE TITLE
              </label>
              <input
                type="text"
                value={form.title}
                onChange={(e) => setForm((f) => ({ ...f, title: e.target.value })}
                onKeyDown={(e) => e.key === 'Enter' && handleAddMilestone()}
                placeholder="e.g. Run a marathon under 4 hours"
                className="w-full px-4 py-3 rounded-xl text-sm outline-none transition-all"
                style={{
                  background: '#202020',
                  border: '1px solid rgba(255,255,255,0.08)',
                  color: '#F0EFEB',
                  fontFamily: 'Nunito, sans-serif',
                }}
              />
            </div>

            {/* Season info */}
            <div
              className="rounded-xl p-3 flex items-center gap-2"
              style={{ background: `${SEASONS[user.currentSeason].color}10` }}
            >
              <span className="text-sm">📅</span>
              <p className="text-xs" style={{ color: 'rgba(255,255,255,0.5)' }}>
                This milestone will be added to{' '}
                <span
                  className="font-700 capitalize"
                  style={{ color: SEASONS[user.currentSeason].color }}
                >
                  {user.currentSeason}
                </span>{' '}
                · Week {currentSeason.currentWeek} of 12
              </p>
            </div>

            {/* Submit */}
            <button
              onClick={handleAddMilestone}
              disabled={!form.title.trim()}
              className="w-full py-3 rounded-xl text-sm font-800 transition-all"
              style={{
                background: form.title.trim() ? '#AADF4F' : 'rgba(255,255,255,0.06)',
                color: form.title.trim() ? '#0F0F0F' : 'rgba(255,255,255,0.2)',
                cursor: form.title.trim() ? 'pointer' : 'not-allowed',
              }}
            >
              Add Milestone
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
