import { NavLink } from 'react-router-dom'
import { Bell, LayoutDashboard, Sun, Leaf, Eye } from 'lucide-react'
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
  const seasonCfg = SEASONS[user.currentSeason]

  return (
    <nav
      style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}
      className="sticky top-0 z-50 bg-[#0F0F0F]/90 backdrop-blur-sm"
    >
      <div className="max-w-7xl mx-auto px-6 flex items-center gap-6 h-14">
        {/* Logo */}
        <span
          className="text-xl font-black tracking-tight mr-2"
          style={{ color: '#AADF4F' }}
        >
          levyl
        </span>

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
              {({ isActive }) => (
                <>
                  <Icon size={14} />
                  {label}
                  {label === 'Seasons' && isActive && (
                    <span
                      className="text-[10px] font-black px-1.5 py-0.5 rounded-full capitalize"
                      style={{ background: `${seasonCfg.color}22`, color: seasonCfg.color }}
                    >
                      {user.currentSeason}
                    </span>
                  )}
                </>
              )}
            </NavLink>
          ))}
        </div>

        {/* Right side */}
        <div className="flex items-center gap-3">
          {/* Streak pill */}
          <div
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-black"
            style={{ background: 'rgba(255,255,255,0.06)', color: '#F0EFEB' }}
          >
            <span>🔥</span>
            <span style={{ color: '#F5C542' }}>{user.streak} day streak</span>
          </div>

          {/* Bell */}
          <button
            className="w-8 h-8 rounded-full flex items-center justify-center transition-colors hover:bg-[#181818]"
            style={{ color: 'rgba(255,255,255,0.4)' }}
          >
            <Bell size={16} />
          </button>

          {/* User */}
          <div className="flex items-center gap-2">
            <div
              className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-black"
              style={{ background: '#AADF4F22', color: '#AADF4F' }}
            >
              {user.name[0]}
            </div>
            <span className="text-sm font-bold" style={{ color: '#F0EFEB' }}>
              {user.name}
            </span>
          </div>
        </div>
      </div>
    </nav>
  )
}
