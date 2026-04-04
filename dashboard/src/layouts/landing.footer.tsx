import { Link } from 'react-router'
import { paths } from '@/navigation/paths'
import { useSiteConfigStore, SITE_NAME_FALLBACK } from '@/stores'

export default function LandingFooter() {
  const siteName = useSiteConfigStore((s) => s.siteName)
  const displayName = siteName?.trim() || SITE_NAME_FALLBACK
  return (
    <footer className="relative mt-auto border-t border-neutral-800/80 bg-neutral-950/80 backdrop-blur-xl">
      <div className="mx-auto max-w-312 px-4 py-12 md:px-6">
        <div className="grid gap-10 lg:grid-cols-[minmax(0,1.2fr)_repeat(3,minmax(0,1fr))]">
          <div className="max-w-md">
            <div className="flex items-center gap-3">
              <span className="grid h-10 w-10 place-items-center rounded-2xl bg-green-500/10 text-green-300 ring-1 ring-green-500/20">
                <i className="fi fi-rr-chart-candlestick text-lg" />
              </span>
              <div>
                <div className="text-lg font-semibold tracking-tight text-neutral-50">{displayName}</div>
                <div className="text-[11px] uppercase tracking-[0.18em] text-neutral-500">
                  Capital Operations
                </div>
              </div>
            </div>

            <p className="mt-4 text-sm leading-6 text-neutral-500">
              A unified workspace for live trading, fiat funding, copy allocations, automation, and
              managed investment products.
            </p>

            <div className="mt-6 flex flex-wrap gap-3">
              <Link
                to="/register"
                className="inline-flex items-center justify-center rounded-full bg-green-500 px-5 py-3 text-sm font-semibold text-neutral-950 transition hover:bg-green-400"
              >
                Open account
              </Link>
              <Link
                to={paths.dashboard}
                className="inline-flex items-center justify-center rounded-full border border-neutral-800 bg-neutral-950/70 px-5 py-3 text-sm font-medium text-neutral-300 transition hover:border-neutral-700 hover:text-neutral-100"
              >
                Dashboard
              </Link>
            </div>
          </div>

          <div>
            <h3 className="text-sm font-semibold uppercase tracking-[0.16em] text-neutral-400">
              Platform
            </h3>
            <ul className="mt-4 space-y-3 text-sm text-neutral-500">
              <li>
                <Link to="/market" className="transition hover:text-green-300">
                  Market overview
                </Link>
              </li>
              <li>
                <Link to="/insights" className="transition hover:text-green-300">
                  Insights
                </Link>
              </li>
              <li>
                <Link to={paths.dashboardLiveTrading} className="transition hover:text-green-300">
                  Live trading desk
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-semibold uppercase tracking-[0.16em] text-neutral-400">
              Company
            </h3>
            <ul className="mt-4 space-y-3 text-sm text-neutral-500">
              <li>
                <Link to="/about" className="transition hover:text-green-300">
                  About {displayName}
                </Link>
              </li>
              <li>
                <Link to="/help" className="transition hover:text-green-300">
                  Help center
                </Link>
              </li>
              <li>
                <Link to="/login" className="transition hover:text-green-300">
                  Sign in
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-semibold uppercase tracking-[0.16em] text-neutral-400">
              Disclosure
            </h3>
            <p className="mt-4 text-sm leading-6 text-neutral-500">
              Digital asset markets are volatile. Execution, leverage, and managed products carry risk.
              Review product disclosures and suitability before funding your account.
            </p>
          </div>
        </div>

        <div className="mt-10 border-t border-neutral-800/80 pt-6 text-xs text-neutral-600">
          <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
            <p>
              (c) {new Date().getFullYear()} {displayName}. All rights reserved.
            </p>
            <p>Capital access, execution visibility, and disciplined product controls in one workspace.</p>
          </div>
        </div>
      </div>
    </footer>
  )
}
