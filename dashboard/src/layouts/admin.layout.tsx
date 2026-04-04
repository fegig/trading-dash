import { Navigate, NavLink, Outlet, useLocation, useNavigate } from 'react-router'
import { useState } from 'react'
import { useAuthStore, useSiteConfigStore, SITE_NAME_FALLBACK } from '../stores'
import { adminNavGroups } from '../navigation/adminNavConfig'

function AdminSidebarContent({ onNavigate }: { onNavigate?: () => void }) {
  const navigate = useNavigate()
  const logout = useAuthStore((s) => s.logout)

  const handleLogout = () => {
    onNavigate?.()
    logout()
    navigate('/login', { replace: true })
  }

  return (
    <nav className="flex flex-col gap-1" aria-label="Admin navigation">
      {adminNavGroups.map((group, gi) => (
        <div key={group.title} className={gi > 0 ? 'mt-3' : ''}>
          <div className={`px-3 pb-1.5 ${gi === 0 ? 'pt-0' : 'pt-2'}`}>
            <span className="text-[10px] font-semibold uppercase tracking-wider text-amber-500/70">
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
                    `flex items-center gap-2 rounded-lg! p-2! text-sm transition-colors ${
                      isActive
                        ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                        : 'text-neutral-400 hover:text-neutral-100 hover:bg-neutral-800/70 border border-transparent'
                    }`
                  }
                >
                  <i
                    className={`fi ${item.iconClass} text-xs w-5 flex justify-center shrink-0 opacity-90`}
                  />
                  <span className="leading-tight">{item.label}</span>
                </NavLink>
              </li>
            ))}
          </ul>
        </div>
      ))}

      <div className="mt-4 pt-4 border-t border-neutral-800 flex flex-col gap-1">
        <NavLink
          to="/dashboard"
          className="flex items-center gap-2 rounded-lg p-2 text-sm text-neutral-400 hover:text-neutral-100 hover:bg-neutral-800/70 border border-transparent transition-colors"
        >
          <i className="fi fi-rr-arrow-left text-xs w-5 flex justify-center shrink-0" />
          <span className="leading-tight">Back to Dashboard</span>
        </NavLink>
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

function AdminMobileDrawer({ open, onClose }: { open: boolean; onClose: () => void }) {
  return (
    <>
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
          onClick={onClose}
        />
      )}
      <div
        className={`fixed top-0 left-0 z-50 h-full w-64 bg-neutral-950 border-r border-neutral-800 transition-transform duration-300 lg:hidden ${
          open ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex items-center justify-between p-4 border-b border-neutral-800">
          <span className="text-amber-400 font-bold text-lg">Admin Panel</span>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-neutral-400 hover:text-neutral-100 hover:bg-neutral-800"
          >
            <i className="fi fi-rr-cross text-sm" />
          </button>
        </div>
        <div className="p-4 overflow-y-auto h-[calc(100%-57px)] scrollBar">
          <AdminSidebarContent onNavigate={onClose} />
        </div>
      </div>
    </>
  )
}

function AdminLayout() {
  const location = useLocation()
  const hydrated = useAuthStore((s) => s.hydrated)
  const isLoggedIn = useAuthStore((s) => s.isLoggedIn)
  const user = useAuthStore((s) => s.user)
  const siteName = useSiteConfigStore((s) => s.siteName)
  const siteLogoUrl = useSiteConfigStore((s) => s.siteLogoUrl)
  const displayName = siteName?.trim() || SITE_NAME_FALLBACK
  const [navOpen, setNavOpen] = useState(false)

  if (!hydrated) {
    return (
      <div className="min-h-dvh flex items-center justify-center bg-neutral-950 text-neutral-400 text-sm">
        Loading session…
      </div>
    )
  }

  if (!isLoggedIn) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />
  }

  if (!user || user.role !== 'admin') {
    return <Navigate to="/dashboard" replace />
  }

  return (
    <div className="min-h-dvh flex flex-col bg-neutral-950 text-gray-100">
      {/* Admin Header */}
      <header className="fixed top-0 left-0 right-0 z-50 h-14 flex items-center border-b border-amber-500/20 bg-neutral-950/95 backdrop-blur-md px-4 md:px-6">
        <div className="max-w-[1920px] mx-auto w-full flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              className="lg:hidden flex items-center justify-center w-10 h-10 rounded-xl bg-amber-500/10 text-amber-400 hover:bg-amber-500/20 border border-amber-500/20 shrink-0"
              onClick={() => setNavOpen(true)}
              aria-label="Open admin navigation"
            >
              <i className="fi fi-rr-menu-burger text-lg" />
            </button>
            <div className="flex items-center gap-2">
              {siteLogoUrl ? (
                <img
                  src={siteLogoUrl}
                  alt=""
                  className="h-8 w-auto max-w-[140px] object-contain"
                />
              ) : null}
              <span className="text-xl md:text-2xl font-bold text-amber-400 shrink-0 tracking-tight">
                {displayName}
              </span>
              <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold bg-amber-500/15 text-amber-400 border border-amber-500/30 uppercase tracking-wider">
                Admin
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2 text-sm text-neutral-400">
            <i className="fi fi-rr-shield-check text-amber-400" />
            <span className="hidden sm:block">{user.email as string}</span>
          </div>
        </div>
      </header>

      <div className="flex flex-1 min-h-0 pt-14 relative overflow-hidden">
        {/* Desktop sidebar */}
        <aside className="hidden lg:block fixed left-0 z-40 w-60 xl:w-64 top-14 bottom-12 border-r border-neutral-800 bg-neutral-950 overflow-y-auto scrollBar">
          <div className="p-4 md:p-6 pr-3 md:pr-4">
            <AdminSidebarContent />
          </div>
        </aside>

        {/* Main content */}
        <main className="flex-1 min-w-0 min-h-0 overflow-y-auto scrollBar px-3 sm:px-4 md:px-6 py-3 sm:py-4 md:py-6 pb-16 sm:pb-12 lg:pl-66 xl:pl-72">
          <Outlet />
        </main>
      </div>

      <AdminMobileDrawer open={navOpen} onClose={() => setNavOpen(false)} />
    </div>
  )
}

export default AdminLayout
