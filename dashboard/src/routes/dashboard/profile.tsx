import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router'
import PageHero from '@/components/common/PageHero'
import GradientBadge from '@/components/common/GradientBadge'
import { get } from '@/util/request'
import { endpoints } from '@/services/endpoints'
import { useAuthStore } from '@/stores'

type MeResponse = {
  user?: {
    user_id?: string
    email?: string
    firstName?: string
    lastName?: string
    verificationStatus?: string
    role?: string
    currency_code?: string
    currency_name?: string
    phone?: string
    country?: string
  }
}

const verificationLabel: Record<string, string> = {
  '0': 'Unverified',
  '1': 'Pending',
  '2': 'Verified',
  '3': 'Rejected',
}

export default function ProfilePage() {
  const authUser = useAuthStore((s) => s.user)
  const [me, setMe] = useState<MeResponse['user'] | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = (await get(endpoints.user.me)) as MeResponse | undefined
      setMe(data?.user ?? null)
    } catch {
      setError('Could not load your profile. Try signing in again.')
      setMe(null)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  const display = me ?? {
    user_id: authUser?.user_id != null ? String(authUser.user_id) : '',
    email: typeof authUser?.email === 'string' ? authUser.email : '',
    firstName: typeof authUser?.firstName === 'string' ? authUser.firstName : '',
    lastName: typeof authUser?.lastName === 'string' ? authUser.lastName : '',
    verificationStatus:
      typeof authUser?.verificationStatus === 'string' ? authUser.verificationStatus : '0',
    role: typeof authUser?.role === 'string' ? authUser.role : 'user',
  }

  const name =
    [display.firstName, display.lastName].filter(Boolean).join(' ').trim() || '—'
  const vs = display.verificationStatus ?? '0'
  const vsLabel = verificationLabel[vs] ?? 'Unknown'

  return (
    <div className="space-y-6">
      <PageHero
        backTo="/dashboard"
        backLabel="Back to Dashboard"
        title="Profile"
        description="Review how you appear on the platform, your verification state, and quick links to update details or security settings."
        stats={[
          { label: 'Role', value: display.role ?? 'user' },
          { label: 'Verification', value: vsLabel },
          {
            label: 'Account ID',
            value:
              display.user_id && display.user_id.length > 14
                ? `${display.user_id.slice(0, 12)}…`
                : display.user_id || '—',
          },
        ]}
        actions={
          <div className="flex flex-wrap gap-2">
            <Link
              to="/dashboard/settings"
              className="inline-flex items-center gap-2 rounded-full border border-neutral-700 bg-neutral-900/80 px-4 py-2 text-xs font-semibold text-neutral-200 hover:border-green-500/40 hover:text-green-300 transition-colors"
            >
              <i className="fi fi-rs-settings text-sm" />
              Settings
            </Link>
            <Link
              to="/dashboard/verification"
              className="inline-flex items-center gap-2 rounded-full border border-green-500/25 bg-green-500/10 px-4 py-2 text-xs font-semibold text-green-300 hover:bg-green-500/15 transition-colors"
            >
              <i className="fi fi-rs-shield-check text-sm" />
              Verification
            </Link>
          </div>
        }
      />

      {error ? (
        <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-200">
          {error}
        </div>
      ) : null}

      <section className="gradient-background rounded-2xl border border-neutral-800/80 p-5 md:p-6 space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-sm font-semibold text-neutral-100">Identity</h2>
          {loading ? (
            <span className="text-xs text-neutral-500">Loading…</span>
          ) : (
            <GradientBadge tone="neutral" size="xs">
              {vsLabel}
            </GradientBadge>
          )}
        </div>

        <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
          <div className="rounded-xl border border-neutral-800 bg-neutral-950/50 p-4">
            <dt className="text-[10px] uppercase tracking-wider text-neutral-500">Display name</dt>
            <dd className="mt-1.5 text-neutral-100 font-medium">{name}</dd>
          </div>
          <div className="rounded-xl border border-neutral-800 bg-neutral-950/50 p-4">
            <dt className="text-[10px] uppercase tracking-wider text-neutral-500">Email</dt>
            <dd className="mt-1.5 text-neutral-100 font-medium break-all">
              {display.email || '—'}
            </dd>
          </div>
          <div className="rounded-xl border border-neutral-800 bg-neutral-950/50 p-4">
            <dt className="text-[10px] uppercase tracking-wider text-neutral-500">Public user ID</dt>
            <dd className="mt-1.5 text-neutral-300 font-mono text-xs break-all">
              {display.user_id || '—'}
            </dd>
          </div>
          <div className="rounded-xl border border-neutral-800 bg-neutral-950/50 p-4">
            <dt className="text-[10px] uppercase tracking-wider text-neutral-500">Default currency</dt>
            <dd className="mt-1.5 text-neutral-100 font-medium">
              {display.currency_code && display.currency_name
                ? `${display.currency_code} · ${display.currency_name}`
                : display.currency_code || '—'}
            </dd>
          </div>
          {(display.phone || display.country) && (
            <>
              <div className="rounded-xl border border-neutral-800 bg-neutral-950/50 p-4">
                <dt className="text-[10px] uppercase tracking-wider text-neutral-500">Phone</dt>
                <dd className="mt-1.5 text-neutral-100">{display.phone || '—'}</dd>
              </div>
              <div className="rounded-xl border border-neutral-800 bg-neutral-950/50 p-4">
                <dt className="text-[10px] uppercase tracking-wider text-neutral-500">Country</dt>
                <dd className="mt-1.5 text-neutral-100">{display.country || '—'}</dd>
              </div>
            </>
          )}
        </dl>
      </section>
    </div>
  )
}
