import { Link, useNavigate, useSearchParams } from 'react-router'
import { useEffect, useState } from 'react'
import axios from 'axios'
import * as authService from '@/services/authService'
import { useAuthStore, useCurrencyStore, type ApiUser } from '@/stores'
import {
  persistPendingOtp,
  sendLoginOtpChallenge,
  userNeedsOnboarding,
  userRequiresTwoFactorLogin,
} from '@/util/authFlow'
import { establishSessionAndNavigate } from '@/util/establishSession'
import { AuthFieldLabel, AuthPanel, authInputClass, authPrimaryButtonClass } from '@/components/auth/AuthPanel'

export default function LoginPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const hydrate = useAuthStore((s) => s.hydrate)

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [passwordShown, setPasswordShown] = useState(false)

  const confirmed = searchParams.get('confirmed') === '1'

  useEffect(() => {
    hydrate()
    const { isLoggedIn, user } = useAuthStore.getState()
    if (!isLoggedIn || !user) return
    if (userNeedsOnboarding(user)) {
      navigate('/onboarding', {
        replace: true,
        state: {
          userId: user.user_id,
          email: user.email,
          resume: true,
          prelimUser: user,
        },
      })
      return
    }
    if (user.currency_id != null && user.currency_id !== '') {
      void authService.getFiatCurrency(user.currency_id as number | string).then((res) => {
        const curr = res.data?.currency
        if (curr?.symbol) {
          useCurrencyStore.getState().setCurrency({
            name: curr.name ?? 'USD',
            symbol: curr.symbol.substring(1, 2),
          })
        }
      })
    }
    navigate('/dashboard', { replace: true })
  }, [hydrate, navigate])

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setBusy(true)
    setError(null)

    authService
      .loginWithPassword(email, password)
      .then(async (response) => {
        const data = response.data
        const u = data?.user as ApiUser | undefined
        if (!u) {
          setError('Unable to sign in. Check your credentials and try again.')
          return
        }

        if (u.verificationStatus === '0') {
          navigate('/verify', {
            replace: false,
            state: {
              email: String(u.email ?? email),
              userId: u.user_id as number,
            },
          })
          return
        }

        if (userNeedsOnboarding(u)) {
          navigate('/onboarding', {
            replace: false,
            state: {
              userId: u.user_id,
              email: String(u.email ?? email),
              apiToken: typeof data?.token === 'string' ? data.token : undefined,
              prelimUser: u,
            },
          })
          return
        }

        if (userRequiresTwoFactorLogin(u)) {
          try {
            const messageId = await sendLoginOtpChallenge(u)
            persistPendingOtp({
              user: u,
              messageId,
              token: typeof data?.token === 'string' ? data.token : undefined,
            })
            navigate('/login/otp')
          } catch {
            setError('Could not send a verification code. Try again in a moment.')
          }
          return
        }

        await establishSessionAndNavigate(u, navigate, {
          token: typeof data?.token === 'string' ? data.token : undefined,
        })
      })
      .catch((err: unknown) => {
        if (axios.isAxiosError(err) && err.response?.data) {
          const data = err.response.data as { message?: string }
          setError(data.message ?? 'Sign-in failed.')
        } else {
          setError('Sign-in failed. Please try again.')
        }
      })
      .finally(() => setBusy(false))
  }

  return (
    <AuthPanel
      title="Sign in"
      subtitle="Use your BlockTrade credentials to access your workspace."
    >
      {confirmed ? (
        <div className="mb-6 rounded-xl border border-green-500/25 bg-green-500/10 px-4 py-3 text-sm text-green-200/90">
          Email verified. You can sign in below.
        </div>
      ) : null}

      <form onSubmit={onSubmit} className="space-y-5">
        {error ? (
          <div
            role="alert"
            className="rounded-xl border border-red-500/35 bg-red-500/10 px-4 py-3 text-sm text-red-200/90"
          >
            {error}
          </div>
        ) : null}

        <div>
          <AuthFieldLabel htmlFor="auth-email">Work email</AuthFieldLabel>
          <input
            id="auth-email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className={authInputClass}
            placeholder="you@company.com"
          />
        </div>

        <div>
          <div className="mb-1.5 flex items-center justify-between gap-2">
            <AuthFieldLabel htmlFor="auth-password">Password</AuthFieldLabel>
            <Link
              to="/forgot"
              className="text-[11px] font-medium uppercase tracking-wider text-green-400/90 hover:text-green-300"
            >
              Forgot?
            </Link>
          </div>
          <div className="relative">
            <input
              id="auth-password"
              type={passwordShown ? 'text' : 'password'}
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className={`${authInputClass} pr-12`}
              placeholder="••••••••"
            />
            <button
              type="button"
              className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-neutral-300"
              onClick={() => setPasswordShown(!passwordShown)}
              aria-label={passwordShown ? 'Hide password' : 'Show password'}
            >
              <i className={`fi ${passwordShown ? 'fi-rr-eye-crossed' : 'fi-rr-eye'} text-base`} />
            </button>
          </div>
        </div>

        <button type="submit" disabled={busy} className={authPrimaryButtonClass}>
          {busy ? 'Signing in…' : 'Continue'}
        </button>
      </form>

      <p className="mt-8 text-center text-sm text-neutral-500">
        No account?{' '}
        <Link to="/register" className="font-medium text-green-400 hover:text-green-300">
          Create one
        </Link>
      </p>
      <p className="mt-3 text-center text-sm">
        <Link to="/" className="text-neutral-500 transition hover:text-neutral-300">
          ← Back to site
        </Link>
      </p>
    </AuthPanel>
  )
}
