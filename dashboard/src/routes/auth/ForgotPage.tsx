import { Link, useSearchParams } from 'react-router'
import { useMemo, useState } from 'react'
import axios from 'axios'
import * as authService from '@/services/authService'
import {
  AuthAlert,
  AuthContextBlock,
  AuthFieldLabel,
  AuthPanel,
  AuthRailList,
  authInputClass,
  authPrimaryButtonClass,
} from '@/components/auth/AuthPanel'

function parseApiError(err: unknown): string {
  if (axios.isAxiosError(err) && err.response?.data) {
    const data = err.response.data as { error?: string; message?: string }
    return data.error ?? data.message ?? 'Something went wrong. Please try again.'
  }
  return 'Something went wrong. Please try again.'
}

export default function ForgotPage() {
  const [searchParams] = useSearchParams()
  const linkToken = useMemo(() => searchParams.get('token')?.trim() ?? '', [searchParams])
  const linkUserId = useMemo(() => searchParams.get('userId')?.trim() ?? '', [searchParams])
  const hasResetLink = linkToken.length > 0 && linkUserId.length > 0

  const [email, setEmail] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [sent, setSent] = useState(false)
  const [passwordDone, setPasswordDone] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const onRequestSubmit = (event: React.FormEvent) => {
    event.preventDefault()
    setBusy(true)
    setError(null)
    authService
      .requestPasswordReset(email)
      .then(() => setSent(true))
      .catch((err: unknown) => {
        setError(parseApiError(err))
      })
      .finally(() => setBusy(false))
  }

  const onPasswordSubmit = (event: React.FormEvent) => {
    event.preventDefault()
    setError(null)
    if (newPassword.length < 8) {
      setError('Password must be at least 8 characters.')
      return
    }
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.')
      return
    }
    setBusy(true)
    authService
      .confirmPasswordReset({
        token: linkToken,
        userId: linkUserId,
        newPassword,
      })
      .then(() => {
        setPasswordDone(true)
      })
      .catch((err: unknown) => {
        setError(parseApiError(err))
      })
      .finally(() => setBusy(false))
  }

  const footer =
    !sent && !passwordDone ? (
      <p className="text-sm text-neutral-500">
        <Link to="/login" className="font-medium text-green-300 transition hover:text-green-200">
          Back to sign in
        </Link>
      </p>
    ) : null

  const contextRail = (
    <>
      <AuthContextBlock
        eyebrow="Password reset"
        title="Recover access to your account."
        body={
          hasResetLink
            ? 'Choose a new password for your account. This link expires after one hour.'
            : 'If the address exists, we email a time-limited link to set a new password.'
        }
        iconClass="fi fi-rr-key"
      />

      <AuthContextBlock eyebrow="Security notes" title="What to expect" iconClass="fi fi-rr-shield-check">
        <AuthRailList
          items={
            hasResetLink
              ? [
                  'Use a strong password you have not used elsewhere.',
                  'After updating, sign in with your email and new password.',
                  'If this link expired, request a new reset from the sign-in page.',
                ]
              : [
                  'If the address exists, reset instructions will be sent shortly.',
                  'Use the latest email only and avoid reusing old reset links.',
                  'Return to sign in after updating your password.',
                ]
          }
        />
      </AuthContextBlock>
    </>
  )

  return (
    <AuthPanel
      eyebrow="Recover account access"
      title={
        passwordDone
          ? 'Password updated'
          : hasResetLink
            ? 'Set a new password'
            : 'Reset your password'
      }
      subtitle={
        passwordDone
          ? 'You can sign in with your new password now.'
          : hasResetLink
            ? 'Enter and confirm your new password below.'
            : sent
              ? 'If an account exists for this address, reset instructions are already on the way.'
              : 'Enter the email associated with your account and we will send a reset link.'
      }
      contextRail={contextRail}
      footer={footer}
    >
      {passwordDone ? (
        <div className="space-y-6">
          <AuthAlert tone="success">
            <p className="flex gap-2">
              <i className="fi fi-rr-check-circle mt-0.5 shrink-0 text-green-400" />
              Your password has been updated.
            </p>
          </AuthAlert>
          <Link to="/login" className={`${authPrimaryButtonClass} inline-flex text-center no-underline`}>
            Sign in
          </Link>
        </div>
      ) : sent && !hasResetLink ? (
        <div className="space-y-6">
          <AuthAlert tone="success">
            <p className="flex gap-2">
              <i className="fi fi-rr-check-circle mt-0.5 shrink-0 text-green-400" />
              Check your inbox and follow the link to choose a new password.
            </p>
          </AuthAlert>
          <Link to="/login" className={`${authPrimaryButtonClass} inline-flex text-center no-underline`}>
            Back to sign in
          </Link>
        </div>
      ) : hasResetLink ? (
        <form onSubmit={onPasswordSubmit} className="space-y-5">
          {error ? <AuthAlert tone="danger">{error}</AuthAlert> : null}
          <div>
            <AuthFieldLabel htmlFor="reset-password">New password</AuthFieldLabel>
            <input
              id="reset-password"
              type="password"
              autoComplete="new-password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
              minLength={8}
              className={authInputClass}
              placeholder="At least 8 characters"
            />
          </div>
          <div>
            <AuthFieldLabel htmlFor="reset-password-confirm">Confirm password</AuthFieldLabel>
            <input
              id="reset-password-confirm"
              type="password"
              autoComplete="new-password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              minLength={8}
              className={authInputClass}
              placeholder="Repeat password"
            />
          </div>
          <button type="submit" disabled={busy} className={authPrimaryButtonClass}>
            {busy ? 'Saving…' : 'Update password'}
          </button>
          <p className="text-sm text-neutral-500">
            <Link to="/login" className="text-green-300 hover:text-green-200">
              Back to sign in
            </Link>
          </p>
        </form>
      ) : (
        <form onSubmit={onRequestSubmit} className="space-y-5">
          {error ? <AuthAlert tone="danger">{error}</AuthAlert> : null}
          <div>
            <AuthFieldLabel htmlFor="forgot-email">Email</AuthFieldLabel>
            <input
              id="forgot-email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
              className={authInputClass}
              placeholder="you@company.com"
            />
          </div>

          <button type="submit" disabled={busy} className={authPrimaryButtonClass}>
            {busy ? 'Sending...' : 'Send reset link'}
          </button>
        </form>
      )}
    </AuthPanel>
  )
}
