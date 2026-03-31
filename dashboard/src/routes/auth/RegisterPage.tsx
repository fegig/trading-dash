import { Link, useNavigate } from 'react-router'
import { useState } from 'react'
import axios from 'axios'
import { toast } from 'react-toastify'
import * as authService from '@/services/authService'
import { getRandomString } from '@/util/random'
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

export default function RegisterPage() {
  const params = new URLSearchParams(typeof window !== 'undefined' ? window.location.search : '')
  const ref = params.get('ref')
  const navigate = useNavigate()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const registerUser = (event: React.FormEvent) => {
    event.preventDefault()
    setError(null)

    if (password.length < 8) {
      setError('Use at least 8 characters for your password.')
      return
    }
    if (password !== confirm) {
      setError('Passwords do not match.')
      return
    }

    setBusy(true)

    const userId = getRandomString(24)
    const payload = { userId, email, refBy: ref, password }

    authService
      .registerUser(payload)
      .then(() => {
        const token = getRandomString(62)
        const time = Math.floor(Date.now() / 1000)
        const expires = Math.floor(time + 172800)
        return authService
          .createAuthToken({
            userId,
            token,
            time,
            expires,
            status: 'pending',
          })
          .then(() => {
            if (typeof window !== 'undefined') localStorage.setItem('token', token)
            return token
          })
      })
      .then((token) => authService.sendVerificationEmail(email, userId, token).then(() => token))
      .then((token) => {
        toast.success('Welcome! Check your email and open the confirmation link to continue.')
        navigate('/verify', { state: { email, userId, token, showWelcome: true } })
      })
      .catch((err: unknown) => {
        if (axios.isAxiosError(err) && err.response?.data) {
          const data = err.response.data
          if (Array.isArray(data)) setError(data.join(' '))
          else if (typeof data === 'object' && data && 'message' in data) {
            setError(String((data as { message: string }).message))
          } else {
            setError('Registration could not be completed.')
          }
        } else {
          setError('Registration could not be completed.')
        }
      })
      .finally(() => setBusy(false))
  }

  const footer = (
    <div className="space-y-3 text-sm">
      <p className="text-neutral-500">
        Already registered?{' '}
        <Link to="/login" className="font-medium text-green-300 transition hover:text-green-200">
          Sign in
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
        eyebrow="Account opening"
        title="Create your workspace in a few steps."
        body="You will verify your email, finish profile and currency preferences, then access the dashboard."
        iconClass="fi fi-rr-user-add"
      >
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
          <AuthMetric label="Step 1" value="Email and password" accent="text-green-300" />
          <AuthMetric label="Step 2" value="Confirm your email" />
        </div>
      </AuthContextBlock>

      <AuthContextBlock eyebrow="What happens next" title="After you sign up" iconClass="fi fi-rr-route">
        <AuthRailList
          items={[
            'We send a confirmation link to your inbox.',
            'You complete profile and default currency on the next screens.',
            'Then you land in the trading and wallet workspace.',
          ]}
        />
      </AuthContextBlock>
    </>
  )

  return (
    <AuthPanel
      eyebrow="Create your account"
      title="Open a BlockTrade workspace"
      subtitle="Set your access credentials first, then continue into verification and profile setup."
      contextRail={contextRail}
      footer={footer}
    >
      <form onSubmit={registerUser} className="space-y-5">
        {error ? <AuthAlert tone="danger">{error}</AuthAlert> : null}

        <div>
          <AuthFieldLabel htmlFor="reg-email">Work email</AuthFieldLabel>
          <input
            id="reg-email"
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
          <AuthFieldLabel htmlFor="reg-password">Password</AuthFieldLabel>
          <input
            id="reg-password"
            type="password"
            autoComplete="new-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
            minLength={8}
            className={authInputClass}
            placeholder="Minimum 8 characters"
          />
        </div>

        <div>
          <AuthFieldLabel htmlFor="reg-confirm">Confirm password</AuthFieldLabel>
          <input
            id="reg-confirm"
            type="password"
            autoComplete="new-password"
            value={confirm}
            onChange={(event) => setConfirm(event.target.value)}
            required
            className={authInputClass}
            placeholder="Repeat password"
          />
        </div>

        <button type="submit" disabled={busy} className={authPrimaryButtonClass}>
          {busy ? 'Creating account...' : 'Continue'}
        </button>

        <p className="text-xs leading-6 text-neutral-600">
          By continuing you agree to our terms and acknowledge applicable risk disclosures.
        </p>
      </form>
    </AuthPanel>
  )
}
