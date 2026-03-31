import { Link } from 'react-router'
import { useState } from 'react'
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

export default function ForgotPage() {
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [busy, setBusy] = useState(false)

  const onSubmit = (event: React.FormEvent) => {
    event.preventDefault()
    setBusy(true)
    authService
      .requestPasswordReset(email)
      .then(() => setSent(true))
      .finally(() => setBusy(false))
  }

  const footer = !sent ? (
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
        body="If the address exists, we email a time-limited link to set a new password."
        iconClass="fi fi-rr-key"
      />

      <AuthContextBlock eyebrow="Security notes" title="What to expect" iconClass="fi fi-rr-shield-check">
        <AuthRailList
          items={[
            'If the address exists, reset instructions will be sent shortly.',
            'Use the latest email only and avoid reusing old reset links.',
            'Return to sign in after updating your password.',
          ]}
        />
      </AuthContextBlock>
    </>
  )

  return (
    <AuthPanel
      eyebrow="Recover account access"
      title="Reset your password"
      subtitle={
        sent
          ? 'If an account exists for this address, reset instructions are already on the way.'
          : 'Enter the email associated with your account and we will send a reset link.'
      }
      contextRail={contextRail}
      footer={footer}
    >
      {sent ? (
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
      ) : (
        <form onSubmit={onSubmit} className="space-y-5">
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
