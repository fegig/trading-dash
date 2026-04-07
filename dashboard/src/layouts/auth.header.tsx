import { Link, NavLink } from 'react-router'
import { useSiteConfigStore, SITE_NAME_FALLBACK } from '@/stores'

export default function AuthHeader() {
  const siteName = useSiteConfigStore((s) => s.siteName)
  const siteLogoUrl = useSiteConfigStore((s) => s.siteLogoUrl)
  const loaded = useSiteConfigStore((s) => s.loaded)
  const displayName = siteName?.trim() || SITE_NAME_FALLBACK
  return (
    <header className="fixed inset-x-0 top-0 z-60 border-b border-neutral-800/80 bg-neutral-950/88 backdrop-blur-xl">
      <nav className="mx-auto flex max-w-304 flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4 sm:py-4 md:px-6">
        <div className="flex min-w-0 items-center">
          <Link to="/" className="flex min-w-0 max-w-full items-center gap-3">
            <div className="min-w-0">
              <div className="flex min-w-0 items-center gap-2 text-base font-semibold tracking-tight text-neutral-50 sm:text-lg">
                {!loaded ? (
                  <div className="h-6 w-28 shrink-0 rounded-lg bg-neutral-800/70 animate-pulse" />
                ) : (
                  <>
                    {siteLogoUrl ? (
                      <img
                        src={siteLogoUrl}
                        alt=""
                        className="h-7 w-auto max-w-[100px] shrink-0 object-contain sm:h-8 sm:max-w-[120px]"
                      />
                    ) : null}
                    <span className="min-w-0 truncate">{displayName}</span>
                  </>
                )}
              </div>
              <div className="text-[10px] uppercase tracking-[0.18em] text-neutral-500 sm:text-[11px]">
                Secure Account Access
              </div>
            </div>
          </Link>
        </div>

        <div className="flex w-full min-w-0 items-center gap-2 sm:w-auto sm:justify-end sm:gap-3">
          <Link
            to="/help"
            className="inline-flex shrink-0 items-center justify-center rounded-full border border-neutral-800 bg-neutral-950/70 px-3 py-2 text-xs font-medium text-neutral-400 transition hover:border-neutral-700 hover:text-neutral-100 sm:px-4 sm:text-sm"
          >
            <span className="sm:hidden">Help</span>
            <span className="hidden sm:inline">Need help?</span>
          </Link>
          <div className="flex min-w-0 flex-1 items-stretch rounded-full border border-neutral-800 bg-neutral-950/70 p-0.5 sm:flex-initial sm:p-1">
            <NavLink
              to="/login"
              className={({ isActive }) =>
                `flex min-w-0 flex-1 items-center justify-center rounded-full px-2 py-2 text-center text-xs font-medium transition sm:flex-initial sm:px-3 sm:text-sm md:px-4 ${
                  isActive ? 'bg-neutral-100 text-neutral-950' : 'text-neutral-400 hover:text-neutral-100'
                }`
              }
            >
              Sign in
            </NavLink>
            <NavLink
              to="/register"
              className={({ isActive }) =>
                `flex min-w-0 flex-1 items-center justify-center rounded-full px-2 py-2 text-center text-xs font-medium transition sm:flex-initial sm:px-3 sm:text-sm md:px-4 ${
                  isActive ? 'bg-green-500 text-neutral-950' : 'text-neutral-400 hover:text-neutral-100'
                }`
              }
            >
              <span className="sm:hidden">Join</span>
              <span className="hidden sm:inline">Create account</span>
            </NavLink>
          </div>
        </div>
      </nav>
    </header>
  )
}
