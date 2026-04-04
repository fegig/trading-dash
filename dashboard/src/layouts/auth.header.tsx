import { Link, NavLink } from 'react-router'
import { useSiteConfigStore, SITE_NAME_FALLBACK } from '@/stores'

export default function AuthHeader() {
  const siteName = useSiteConfigStore((s) => s.siteName)
  const siteLogoUrl = useSiteConfigStore((s) => s.siteLogoUrl)
  const displayName = siteName?.trim() || SITE_NAME_FALLBACK
  return (
    <header className="fixed inset-x-0 top-0 z-60 border-b border-neutral-800/80 bg-neutral-950/88 backdrop-blur-xl">
      <nav className="mx-auto flex max-w-304 items-center justify-between gap-4 px-4 py-4 md:px-6">
        <div className="flex items-center gap-3">
          <Link to="/" className="flex items-center gap-3">
            <span className="grid h-10 w-10 place-items-center rounded-2xl bg-green-500/10 text-green-300 ring-1 ring-green-500/20">
              <i className="fi fi-rr-chart-candlestick text-lg" />
            </span>
            <div>
              <div className="flex items-center gap-2 text-lg font-semibold tracking-tight text-neutral-50">
                {siteLogoUrl ? (
                  <img src={siteLogoUrl} alt="" className="h-8 w-auto max-w-[120px] object-contain" />
                ) : null}
                <span>{displayName}</span>
              </div>
              <div className="text-[11px] uppercase tracking-[0.18em] text-neutral-500">
                Secure Account Access
              </div>
            </div>
          </Link>
        </div>

        <div className="flex items-center gap-3">
          <Link
            to="/help"
            className="hidden rounded-full border border-neutral-800 bg-neutral-950/70 px-4 py-2.5 text-sm font-medium text-neutral-400 transition hover:border-neutral-700 hover:text-neutral-100 md:inline-flex"
          >
            Need help?
          </Link>
          <div className="flex items-center rounded-full border border-neutral-800 bg-neutral-950/70 p-1">
            <NavLink
              to="/login"
              className={({ isActive }) =>
                `rounded-full px-3 py-2 text-sm font-medium transition md:px-4 ${
                  isActive ? 'bg-neutral-100 text-neutral-950' : 'text-neutral-400 hover:text-neutral-100'
                }`
              }
            >
              Sign in
            </NavLink>
            <NavLink
              to="/register"
              className={({ isActive }) =>
                `rounded-full px-3 py-2 text-sm font-medium transition md:px-4 ${
                  isActive ? 'bg-green-500 text-neutral-950' : 'text-neutral-400 hover:text-neutral-100'
                }`
              }
            >
              Create account
            </NavLink>
          </div>
        </div>
      </nav>
    </header>
  )
}
