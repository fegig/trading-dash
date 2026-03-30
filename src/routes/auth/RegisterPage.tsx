import { Link, useNavigate } from 'react-router'
import { useState } from 'react'
import axios from 'axios'
import * as authService from '@/services/authService'
import { getRandomString } from '@/util/random'
import {
  AuthFieldLabel,
  AuthPanel,
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

  const registerUser = (e: React.FormEvent) => {
    e.preventDefault()
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
    const refPayload = {
      userId,
      refBy: ref,
      refId: getRandomString(24),
      amount: '50',
      date: Math.floor(Date.now() / 1000),
    }

    const chain = ref
      ? authService.registerReferral(refPayload).catch(() => undefined)
      : Promise.resolve()

    chain
      .then(() => authService.registerUser(payload))
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
          .then(() => token)
      })
      .then((token) => authService.sendVerificationEmail(email, userId, token).then(() => token))
      .then((token) => {
        navigate('/verify', { state: { email, userId, token } })
      })
      .catch((err: unknown) => {
        if (axios.isAxiosError(err) && err.response?.data) {
          const data = err.response.data
          if (Array.isArray(data)) setError(data.join(' '))
          else if (typeof data === 'object' && data && 'message' in data) {
            setError(String((data as { message: string }).message))
          } else setError('Registration could not be completed.')
        } else {
          setError('Registration could not be completed.')
        }
      })
      .finally(() => setBusy(false))
  }

  return (
    <AuthPanel
      title="Create your account"
      subtitle="Verify your email, then sign in to your workspace."
    >
      <form onSubmit={registerUser} className="space-y-5">
        {error ? (
          <div
            role="alert"
            className="rounded-xl border border-red-500/35 bg-red-500/10 px-4 py-3 text-sm text-red-200/90"
          >
            {error}
          </div>
        ) : null}

        <div>
          <AuthFieldLabel htmlFor="reg-email">Work email</AuthFieldLabel>
          <input
            id="reg-email"
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
          <AuthFieldLabel htmlFor="reg-password">Password</AuthFieldLabel>
          <input
            id="reg-password"
            type="password"
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
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
            onChange={(e) => setConfirm(e.target.value)}
            required
            className={authInputClass}
            placeholder="Repeat password"
          />
        </div>

        <button type="submit" disabled={busy} className={authPrimaryButtonClass}>
          {busy ? 'Creating account…' : 'Continue'}
        </button>

        <p className="text-center text-xs leading-relaxed text-neutral-600">
          By continuing you agree to our terms and acknowledge applicable risk disclosures.
        </p>
      </form>

      <p className="mt-8 text-center text-sm text-neutral-500">
        Already registered?{' '}
        <Link to="/login" className="font-medium text-green-400 hover:text-green-300">
          Sign in
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
