import { Link } from 'react-router'
import { useState } from 'react'
import * as authService from '@/services/authService'
import {
  AuthFieldLabel,
  AuthPanel,
  authInputClass,
  authPrimaryButtonClass,
} from '@/components/auth/AuthPanel'

export default function ForgotPage() {
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [busy, setBusy] = useState(false)

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setBusy(true)
    authService
      .requestPasswordReset(email)
      .then(() => setSent(true))
      .finally(() => setBusy(false))
  }

  return (
    <AuthPanel
      title="Reset password"
      subtitle={
        sent
          ? 'If an account exists for this address, you will receive reset instructions shortly.'
          : 'Enter the email associated with your account. We will email you a reset link.'
      }
    >
      {sent ? (
        <div className="space-y-6">
          <div className="rounded-xl border border-green-500/25 bg-green-500/10 px-4 py-4 text-sm text-green-100/90">
            <p className="flex gap-2">
              <i className="fi fi-rr-check-circle mt-0.5 shrink-0 text-green-400" />
              Check your inbox and follow the link to choose a new password.
            </p>
          </div>
          <Link to="/login" className={`${authPrimaryButtonClass} inline-block text-center no-underline`}>
            Back to sign in
          </Link>
        </div>
      ) : (
        <form onSubmit={onSubmit} className="space-y-5">
          <div>
            <AuthFieldLabel htmlFor="forgot-email">Email</AuthFieldLabel>
            <input
              id="forgot-email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className={authInputClass}
              placeholder="you@company.com"
            />
          </div>
          <button type="submit" disabled={busy} className={authPrimaryButtonClass}>
            {busy ? 'Sending…' : 'Send reset link'}
          </button>
        </form>
      )}

      {!sent ? (
        <p className="mt-8 text-center text-sm text-neutral-500">
          <Link to="/login" className="font-medium text-green-400 hover:text-green-300">
            ← Sign in
          </Link>
        </p>
      ) : null}
    </AuthPanel>
  )
}
