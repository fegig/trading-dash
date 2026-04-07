import { Link, NavLink } from 'react-router'
import { useEffect, useState } from 'react'
import { useAuthStore } from '@/stores/authStore'
import { useSiteConfigStore, SITE_NAME_FALLBACK } from '@/stores'
import { paths } from '@/navigation/paths'

const navItems = [
  { to: '/about', label: 'About' },
  { to: '/market', label: 'Markets' },
  { to: '/help', label: 'Help' },
  { to: '/insights', label: 'Insights' },
]

const navLinkClass = ({ isActive }: { isActive: boolean }) =>
  `text-sm font-medium transition-colors ${
    isActive ? 'text-neutral-50' : 'text-neutral-400 hover:text-neutral-100'
  }`

export default function LandingHeader() {
  const [open, setOpen] = useState(false)
  const hydrate = useAuthStore((state) => state.hydrate)
  const isLoggedIn = useAuthStore((state) => state.isLoggedIn)
  const siteName = useSiteConfigStore((s) => s.siteName)
  const siteLogoUrl = useSiteConfigStore((s) => s.siteLogoUrl)
  const loaded = useSiteConfigStore((s) => s.loaded)
  const displayName = siteName?.trim() || SITE_NAME_FALLBACK

  useEffect(() => {
    hydrate()
  }, [hydrate])

  return (
    <header className="fixed inset-x-0 top-0 z-60 border-b border-neutral-800/80 bg-neutral-950/88 backdrop-blur-xl">
      <div className="mx-auto flex  items-center justify-between gap-4 px-4 py-4 md:px-6">
        <Link to="/" className="flex items-center gap-3">
          <span>
            <span className="flex items-center gap-2">
              {!loaded ? (
                <div className="h-6 w-28 rounded-lg bg-neutral-800/70 animate-pulse" />
              ) : (
                <>
                  {siteLogoUrl ? (
                    <img src={siteLogoUrl} alt="" className="h-8 w-auto max-w-[120px] object-contain" />
                  ) : null}
                  <span className="block text-lg font-semibold tracking-tight text-neutral-50">{displayName}</span>
                </>
              )}
            </span>
            <span className="block text-[11px] uppercase tracking-[0.18em] text-neutral-500">
              Capital Operations
            </span>
          </span>
        </Link>

        <nav
          className="hidden items-center gap-6 rounded-full border border-neutral-800 bg-neutral-950/70 px-5 py-3 md:flex"
          aria-label="Marketing"
        >
          {navItems.map((item) => (
            <NavLink key={item.to} to={item.to} className={navLinkClass}>
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="hidden items-center gap-3 md:flex">
          {isLoggedIn ? (
            <Link
              to={paths.dashboard}
              className="inline-flex items-center justify-center rounded-full bg-green-500 px-5 py-3 text-sm font-semibold text-neutral-950 transition hover:bg-green-400"
            >
              Open dashboard
            </Link>
          ) : (
            <>
              <Link
                to="/login"
                className="inline-flex items-center justify-center rounded-full border border-neutral-800 bg-neutral-950/70 px-4 py-3 text-sm font-medium text-neutral-300 transition hover:border-neutral-700 hover:text-neutral-100"
              >
                Sign in
              </Link>
              <Link
                to="/register"
                className="inline-flex items-center justify-center rounded-full bg-green-500 px-5 py-3 text-sm font-semibold text-neutral-950 transition hover:bg-green-400"
              >
                Open account
              </Link>
            </>
          )}
        </div>

        <button
          type="button"
          className="flex h-11 w-11 items-center justify-center rounded-2xl border border-neutral-800 bg-neutral-950/70 text-neutral-300 md:hidden"
          aria-label="Toggle menu"
          onClick={() => setOpen((value) => !value)}
        >
          <i className={`fi ${open ? 'fi-rr-cross' : 'fi-rr-menu-burger'} text-base`} />
        </button>
      </div>

      {open ? (
        <div className="border-t border-neutral-800/80 bg-neutral-950/96 px-4 py-4 shadow-[0_24px_60px_-32px_rgba(0,0,0,0.9)] md:hidden">
          <nav className="flex flex-col gap-3">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={navLinkClass}
                onClick={() => setOpen(false)}
              >
                {item.label}
              </NavLink>
            ))}
            <div className="mt-3 flex flex-col gap-3 border-t border-neutral-800/80 pt-4">
              {isLoggedIn ? (
                <Link
                  to={paths.dashboard}
                  className="inline-flex items-center justify-center rounded-full bg-green-500 px-5 py-3 text-sm font-semibold text-neutral-950"
                  onClick={() => setOpen(false)}
                >
                  Open dashboard
                </Link>
              ) : (
                <>
                  <Link
                    to="/login"
                    className="inline-flex items-center justify-center rounded-full border border-neutral-800 bg-neutral-950/70 px-4 py-3 text-sm font-medium text-neutral-300"
                    onClick={() => setOpen(false)}
                  >
                    Sign in
                  </Link>
                  <Link
                    to="/register"
                    className="inline-flex items-center justify-center rounded-full bg-green-500 px-5 py-3 text-sm font-semibold text-neutral-950"
                    onClick={() => setOpen(false)}
                  >
                    Open account
                  </Link>
                </>
              )}
            </div>
          </nav>
        </div>
      ) : null}
    </header>
  )
}
