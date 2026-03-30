import { Link, NavLink } from 'react-router'
import { useEffect, useState } from 'react'
import { useAuthStore } from '@/stores/authStore'
import { paths } from '@/navigation/paths'

const navLinkClass = ({ isActive }: { isActive: boolean }) =>
  `text-sm font-medium transition-colors ${isActive ? 'text-green-400' : 'text-neutral-400 hover:text-neutral-100'}`

export default function LandingHeader() {
  const [open, setOpen] = useState(false)
  const hydrate = useAuthStore((s) => s.hydrate)
  const isLoggedIn = useAuthStore((s) => s.isLoggedIn)

  useEffect(() => {
    hydrate()
  }, [hydrate])

  return (
    <header className="sticky top-0 z-50 border-b border-neutral-800 bg-neutral-950/95 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3 md:px-6">
        <Link to="/" className="text-lg font-bold tracking-tight text-green-400 hover:text-green-300">
          BlockTrade
        </Link>

        <nav className="hidden items-center gap-6 md:flex" aria-label="Marketing">
          <NavLink to="/about" className={navLinkClass}>
            About
          </NavLink>
          <NavLink to="/market" className={navLinkClass}>
            Markets
          </NavLink>
          <NavLink to="/help" className={navLinkClass}>
            Help
          </NavLink>
          <NavLink to="/insights" className={navLinkClass}>
            Insights
          </NavLink>
        </nav>

        <div className="hidden items-center gap-3 md:flex">
          {isLoggedIn ? (
            <Link
              to={paths.dashboard}
              className="rounded-xl bg-green-500/90 px-4 py-2 text-sm font-semibold text-neutral-950 hover:bg-green-400"
            >
              Dashboard
            </Link>
          ) : (
            <>
              <Link to="/login" className="text-sm text-neutral-300 hover:text-green-400">
                Login
              </Link>
              <Link
                to="/register"
                className="rounded-xl bg-green-500/90 px-4 py-2 text-sm font-semibold text-neutral-950 hover:bg-green-400"
              >
                Register
              </Link>
            </>
          )}
        </div>

        <button
          type="button"
          className="flex h-10 w-10 items-center justify-center rounded-lg border border-neutral-800 md:hidden"
          aria-label="Menu"
          onClick={() => setOpen(!open)}
        >
          <i className={`fi ${open ? 'fi-rr-cross' : 'fi-rr-menu-burger'} text-neutral-300`} />
        </button>
      </div>

      {open ? (
        <div className="border-t border-neutral-800 bg-neutral-950 px-4 py-4 md:hidden">
          <nav className="flex flex-col gap-3">
            <NavLink to="/about" className={navLinkClass} onClick={() => setOpen(false)}>
              About
            </NavLink>
            <NavLink to="/market" className={navLinkClass} onClick={() => setOpen(false)}>
              Markets
            </NavLink>
            <NavLink to="/help" className={navLinkClass} onClick={() => setOpen(false)}>
              Help
            </NavLink>
            <NavLink to="/insights" className={navLinkClass} onClick={() => setOpen(false)}>
              Insights
            </NavLink>
            <hr className="border-neutral-800" />
            {isLoggedIn ? (
              <Link
                to={paths.dashboard}
                className="text-center text-sm font-semibold text-green-400"
                onClick={() => setOpen(false)}
              >
                Dashboard
              </Link>
            ) : (
              <>
                <Link to="/login" className="text-sm text-neutral-300" onClick={() => setOpen(false)}>
                  Login
                </Link>
                <Link to="/register" className="text-sm text-green-400" onClick={() => setOpen(false)}>
                  Register
                </Link>
              </>
            )}
          </nav>
        </div>
      ) : null}
    </header>
  )
}
