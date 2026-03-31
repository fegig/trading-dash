import { useState } from 'react'
import { Link, useLocation } from 'react-router'

type ConsentPreferences = {
  essential: true
  analytics: boolean
  marketing: boolean
  updatedAt: number
}

const COOKIE_CONSENT_KEY = 'BT__COOKIE_CONSENT'

function readConsent(): ConsentPreferences | null {
  if (typeof window === 'undefined') return null

  const raw = window.localStorage.getItem(COOKIE_CONSENT_KEY)
  if (!raw) return null

  try {
    return JSON.parse(raw) as ConsentPreferences
  } catch {
    return null
  }
}

function persistConsent(preferences: ConsentPreferences) {
  window.localStorage.setItem(COOKIE_CONSENT_KEY, JSON.stringify(preferences))
}

export default function CookieConsent() {
  const location = useLocation()
  const [storedConsent] = useState(() => readConsent())
  const [visible, setVisible] = useState(() => storedConsent == null)
  const [expanded, setExpanded] = useState(false)
  const [analytics, setAnalytics] = useState(() => storedConsent?.analytics ?? true)
  const [marketing, setMarketing] = useState(() => storedConsent?.marketing ?? false)

  const showOnRoute = !location.pathname.startsWith('/dashboard')

  if (!visible || !showOnRoute) {
    return null
  }

  const savePreferences = (nextAnalytics: boolean, nextMarketing: boolean) => {
    persistConsent({
      essential: true,
      analytics: nextAnalytics,
      marketing: nextMarketing,
      updatedAt: Date.now(),
    })
    setAnalytics(nextAnalytics)
    setMarketing(nextMarketing)
    setVisible(false)
    setExpanded(false)
  }

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-0 z-[70] px-4 pb-4 md:px-6 md:pb-6">
      <div className="mx-auto max-w-[78rem]">
        <div className="pointer-events-auto overflow-hidden rounded-[28px] border border-neutral-800/90 bg-neutral-950/92 shadow-[0_32px_90px_-44px_rgba(0,0,0,0.95)] backdrop-blur-xl">
          <div
            className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_bottom,rgba(255,255,255,0.02),transparent_26%),radial-gradient(circle_at_top_right,rgba(34,197,94,0.08),transparent_32%)]"
            aria-hidden
          />
          <div className="relative p-5 md:p-6">
            <div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
              <div className="max-w-3xl">
                <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-green-300">
                  Cookie preferences
                </div>
                <h2 className="mt-2 text-xl font-semibold tracking-tight text-neutral-50">
                  We use essential cookies to keep the platform secure and optional cookies to improve the experience.
                </h2>
                <p className="mt-3 text-sm leading-6 text-neutral-500">
                  Essential cookies keep account access, session continuity, and security behavior working.
                  Optional analytics help us understand public-page performance, while marketing cookies support campaign measurement.
                </p>
                <p className="mt-3 text-sm text-neutral-500">
                  By continuing, you can accept all cookies, reject non-essential ones, or tailor the optional categories below.
                </p>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row xl:justify-end">
                <button
                  type="button"
                  onClick={() => savePreferences(false, false)}
                  className="rounded-full border border-neutral-700 bg-neutral-900/50 px-5 py-3 text-sm font-semibold text-neutral-200 transition hover:border-neutral-600 hover:bg-neutral-900/70"
                >
                  Reject optional
                </button>
                <button
                  type="button"
                  onClick={() => savePreferences(true, true)}
                  className="rounded-full bg-green-500 px-5 py-3 text-sm font-semibold text-neutral-950 transition hover:bg-green-400"
                >
                  Accept all
                </button>
              </div>
            </div>

            <div className="mt-5 flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={() => setExpanded((value) => !value)}
                className="inline-flex items-center gap-2 rounded-full border border-neutral-800 bg-neutral-950/60 px-4 py-2 text-sm font-medium text-neutral-300 transition hover:border-neutral-700 hover:text-neutral-100"
              >
                <i className={`fi ${expanded ? 'fi-rr-angle-small-up' : 'fi-rr-angle-small-down'} text-base`} />
                Manage preferences
              </button>
              <Link
                to="/help"
                className="text-sm font-medium text-neutral-500 transition hover:text-green-300"
              >
                Learn more about platform support
              </Link>
            </div>

            {expanded ? (
              <div className="mt-5 grid gap-3 md:grid-cols-3">
                <div className="rounded-2xl border border-neutral-800 bg-neutral-950/70 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="text-sm font-semibold text-neutral-100">Essential</div>
                      <p className="mt-2 text-sm leading-6 text-neutral-500">
                        Required for sign-in state, security, and core product behavior.
                      </p>
                    </div>
                    <span className="rounded-full bg-green-500/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-green-300">
                      Always on
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setAnalytics((value) => !value)}
                  className={`rounded-2xl border p-4 text-left transition ${
                    analytics
                      ? 'border-green-500/25 bg-green-500/8'
                      : 'border-neutral-800 bg-neutral-950/70 hover:border-neutral-700'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="text-sm font-semibold text-neutral-100">Analytics</div>
                      <p className="mt-2 text-sm leading-6 text-neutral-500">
                        Helps us understand public-page performance and improve the experience.
                      </p>
                    </div>
                    <span
                      className={`rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] ${
                        analytics ? 'bg-green-500/10 text-green-300' : 'bg-neutral-800 text-neutral-400'
                      }`}
                    >
                      {analytics ? 'Enabled' : 'Disabled'}
                    </span>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setMarketing((value) => !value)}
                  className={`rounded-2xl border p-4 text-left transition ${
                    marketing
                      ? 'border-green-500/25 bg-green-500/8'
                      : 'border-neutral-800 bg-neutral-950/70 hover:border-neutral-700'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="text-sm font-semibold text-neutral-100">Marketing</div>
                      <p className="mt-2 text-sm leading-6 text-neutral-500">
                        Supports campaign attribution and external acquisition measurement.
                      </p>
                    </div>
                    <span
                      className={`rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] ${
                        marketing ? 'bg-green-500/10 text-green-300' : 'bg-neutral-800 text-neutral-400'
                      }`}
                    >
                      {marketing ? 'Enabled' : 'Disabled'}
                    </span>
                  </div>
                </button>
              </div>
            ) : null}

            {expanded ? (
              <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={() => savePreferences(analytics, marketing)}
                  className="rounded-full bg-green-500 px-5 py-3 text-sm font-semibold text-neutral-950 transition hover:bg-green-400"
                >
                  Save preferences
                </button>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  )
}
