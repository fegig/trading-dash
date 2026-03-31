import { NavLink, useNavigate } from 'react-router'
import { navGroups } from '../navigation/navConfig'
import { useAuthStore } from '../stores'

type Props = {
  onNavigate?: () => void
}

export function NavSidebarContent({ onNavigate }: Props) {
  const navigate = useNavigate()
  const logout = useAuthStore((s) => s.logout)

  const handleLogout = () => {
    onNavigate?.()
    logout()
    navigate('/login', { replace: true })
  }

  return (
    <nav className="flex flex-col gap-1" aria-label="Main navigation">
      {navGroups.map((group, groupIndex) => (
        <div key={group.title} className={groupIndex > 0 ? 'mt-3' : ''}>
          <div className={`px-3 pb-1.5 ${groupIndex === 0 ? 'pt-0' : 'pt-2'}`}>
            <span className="text-[10px] font-semibold uppercase tracking-wider text-neutral-500">
              {group.title}
            </span>
          </div>
          <ul className="flex flex-col gap-0.5">

            {group.items.map((item) => (
              <li key={item.path}>
                <NavLink
                  to={item.path}
                  end={item.end}
                  onClick={() => onNavigate?.()}
                  className={({ isActive }) =>
                    `flex items-center gap-2  rounded-lg! p-2!  text-sm  transition-colors ${
                      isActive
                        ? 'gradient-background text-neutral-500 hover:text-green-400'
                        : 'text-neutral-400 hover:text-neutral-100 hover:bg-neutral-800/70 border border-transparent'
                    }`
                  }
                >
                  <i className={`fi ${item.iconClass} text-xs w-5 flex justify-center shrink-0 opacity-90`} />
                  <span className="leading-tight">{item.label}</span>
                </NavLink>
              </li>
            ))}
          </ul>
        </div>
      ))}

      <div className="mt-4 pt-4 border-t border-neutral-800">
        <button
          type="button"
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-red-400/90 hover:bg-red-500/10 border border-transparent transition-colors"
        >
          <i className="fi fi-rr-power text-lg w-5 flex justify-center" />
          Logout
        </button>
      </div>
    </nav>
  )
}
