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
import { startSession } from '@/util/establishSession'
import {
  AuthAlert,
  AuthContextBlock,
  AuthFieldLabel,
  AuthMetric,
  AuthPanel,
  AuthRailList,
  authInputClass,
  authPrimaryButtonClass,
} from '@/components/auth/AuthPanel'

export default function LoginPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const hydrate = useAuthStore((state) => state.hydrate)

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
    if (user.role === 'admin') {
      navigate('/admin', { replace: true })
      return
    }
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

  const onSubmit = (event: React.FormEvent) => {
    event.preventDefault()
    setBusy(true)
    setError(null)

    authService
      .loginWithPassword(email, password)
      .then(async (response) => {
        const data = response.data
        const user = data?.user as ApiUser | undefined
        if (!user) {
          setError('Unable to sign in. Check your credentials and try again.')
          return
        }

        if (user.verificationStatus === '0') {
          navigate('/verify', {
            replace: false,
            state: {
              email: String(user.email ?? email),
              userId: user.user_id as number,
            },
          })
          return
        }

        if (user.role === 'admin') {
          await startSession(user, navigate, {
            token: typeof data?.token === 'string' ? data.token : undefined,
            to: '/admin',
          })
          return
        }

        if (userNeedsOnboarding(user)) {
          navigate('/onboarding', {
            replace: false,
            state: {
              userId: user.user_id,
              email: String(user.email ?? email),
              apiToken: typeof data?.token === 'string' ? data.token : undefined,
              prelimUser: user,
            },
          })
          return
        }

        if (userRequiresTwoFactorLogin(user)) {
          try {
            const messageId = await sendLoginOtpChallenge(user)
            persistPendingOtp({
              user,
              messageId,
              token: typeof data?.token === 'string' ? data.token : undefined,
            })
            navigate('/login/otp')
          } catch {
            setError('Could not send a verification code. Try again in a moment.')
          }
          return
        }

        await startSession(user, navigate, {
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

  const footer = (
    <div className="space-y-3 text-sm">
      <p className="text-neutral-500">
        No account?{' '}
        <Link to="/register" className="font-medium text-green-300 transition hover:text-green-200">
          Create one
        </Link>
      </p>
      <p>
        <Link to="/" className="text-neutral-500 transition hover:text-neutral-300">
          Back to site
        </Link>
      </p>
    </div>
  )

  const contextRail = (
    <>
      <AuthContextBlock
        eyebrow="Account access"
        title="One workspace for trading, funding, and managed products."
        body="Sign in to reach live markets, your wallet, copy trading, bots, and investments."
        iconClass="fi fi-rr-shield-check"
      >
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
          <AuthMetric label="Access mode" value="Password + verification" accent="text-green-300" />
          <AuthMetric label="Funding path" value="Fiat wallet ready" />
        </div>
      </AuthContextBlock>

      <AuthContextBlock
        eyebrow="After sign-in"
        title="What opens next"
        iconClass="fi fi-rr-apps"
      >
        <AuthRailList
          items={[
            'Review live setups and trade history from one command surface.',
            'Move capital through wallet, copy trading, bots, and investments.',
            'Track readiness, limits, and verification state without leaving the workspace.',
          ]}
        />
      </AuthContextBlock>
    </>
  )

  return (
    <AuthPanel
      eyebrow="Secure sign-in"
      title="Access your BlockTrade workspace"
      subtitle="Sign in with your email and password to open trading, wallet funding, managed products, and account controls."
      contextRail={contextRail}
      footer={footer}
    >
      {confirmed ? (
        <AuthAlert tone="success" className="mb-6">
          Email verified. You can sign in below.
        </AuthAlert>
      ) : null}

      <form onSubmit={onSubmit} className="space-y-5">
        {error ? (
          <AuthAlert tone="danger" className="mb-1">
            {error}
          </AuthAlert>
        ) : null}

        <div>
          <AuthFieldLabel htmlFor="auth-email">Work email</AuthFieldLabel>
          <input
            id="auth-email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
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
              className="text-[11px] font-semibold uppercase tracking-[0.16em] text-green-300 transition hover:text-green-200"
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
              onChange={(event) => setPassword(event.target.value)}
              required
              className={`${authInputClass} pr-12`}
              placeholder="Enter your password"
            />
            <button
              type="button"
              className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-500 transition hover:text-neutral-300"
              onClick={() => setPasswordShown((value) => !value)}
              aria-label={passwordShown ? 'Hide password' : 'Show password'}
            >
              <i className={`fi ${passwordShown ? 'fi-rr-eye-crossed' : 'fi-rr-eye'} text-base`} />
            </button>
          </div>
        </div>

        <button type="submit" disabled={busy} className={authPrimaryButtonClass}>
          {busy ? 'Signing in...' : 'Continue'}
        </button>
      </form>
    </AuthPanel>
  )
}
