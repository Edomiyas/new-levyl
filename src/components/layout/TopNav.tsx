import { NavLink } from 'react-router-dom'
import { Zap, LayoutDashboard, Sun, Leaf, Eye } from 'lucide-react'
import { useAppStore } from '../../store/appStore'
import { SEASONS } from '../../lib/constants'

const NAV_ITEMS = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/today', label: 'Today', icon: Sun },
  { to: '/seasons', label: 'Seasons', icon: Leaf },
  { to: '/vision', label: 'Vision', icon: Eye },
]

export function TopNav() {
  const { user } = useAppStore()
  const seasonColor = SEASONS[user.currentSeason].color
  const xpToNext = 3000
  const xpPct = Math.round((user.xp / xpToNext) * 100)

  return (
    <nav
      style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}
      className="sticky top-0 z-50 bg-[#0F0F0F]/90 backdrop-blur-sm"
    >
      <div className="max-w-7xl mx-auto px-6 flex items-center gap-6 h-14">
        {/* Logo */}
        <div className="flex items-center gap-2 mr-2">
          <span
            className="text-xl font-black tracking-tight"
            style={{ color: '#AADF4F' }}
          >
            levyl
          </span>
        </div>

        {/* Nav links */}
        <div className="flex items-center gap-1 flex-1">
          {NAV_ITEMS.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-600 transition-all ${
                  isActive
                    ? 'text-[#F0EFEB] bg-[#202020]'
                    : 'text-[rgba(255,255,255,0.36)] hover:text-[#F0EFEB] hover:bg-[#181818]'
                }`
              }
            >
              <Icon size={14} />
              {label}
            </NavLink>
          ))}
        </div>

        {/* XP + level */}
        <div className="flex items-center gap-3">
          {/* Streak */}
          <div className="flex items-center gap-1 text-sm font-700">
            <span>🔥</span>
            <span style={{ color: '#F5C542' }}>{user.streak}</span>
          </div>

          {/* XP bar */}
          <div className="flex items-center gap-2">
            <Zap size={13} style={{ color: '#AADF4F' }} />
            <div className="flex flex-col gap-0.5 w-24">
              <div className="flex justify-between">
                <span className="text-[10px] font-700" style={{ color: '#AADF4F' }}>
                  Lv {user.level}
                </span>
                <span className="text-[10px]" style={{ color: 'rgba(255,255,255,0.36)' }}>
                  {user.xp}/{xpToNext}
                </span>
              </div>
              <div
                className="h-1 rounded-full overflow-hidden"
                style={{ background: 'rgba(255,255,255,0.08)' }}
              >
                <div
                  className="h-full rounded-full transition-all"
                  style={{ width: `${xpPct}%`, background: '#AADF4F' }}
                />
              </div>
            </div>
          </div>

          {/* Season badge */}
          <div
            className="px-2.5 py-1 rounded-full text-[11px] font-800 capitalize"
            style={{ background: `${seasonColor}22`, color: seasonColor }}
          >
            {user.currentSeason}
          </div>

          {/* Avatar */}
          <div
            className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-800"
            style={{ background: '#AADF4F22', color: '#AADF4F' }}
          >
            {user.name[0]}
          </div>
        </div>
      </div>
    </nav>
  )
}
