import { Link, useNavigate } from 'react-router'
import { useCallback, useEffect, useState } from 'react'
import * as authService from '@/services/authService'
import {
  clearPendingOtp,
  persistPendingOtp,
  readPendingOtp,
  sendLoginOtpChallenge,
} from '@/util/authFlow'
import { establishSessionAndNavigate } from '@/util/establishSession'
import type { ApiUser } from '@/stores'
import {
  AuthAlert,
  AuthContextBlock,
  AuthMetric,
  AuthPanel,
  AuthRailList,
  authPrimaryButtonClass,
  authSecondaryButtonClass,
} from '@/components/auth/AuthPanel'

export default function LoginOtpPage() {
  const navigate = useNavigate()
  const [payload, setPayload] = useState<ReturnType<typeof readPendingOtp>>(null)
  const [otpReady, setOtpReady] = useState(false)
  const [code, setCode] = useState('')
  const [busy, setBusy] = useState(false)
  const [resendBusy, setResendBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [info, setInfo] = useState<string | null>(null)

  useEffect(() => {
    const pending = readPendingOtp()
    if (!pending?.user?.user_id || !pending.messageId) {
      setPayload(null)
    } else {
      setPayload(pending)
    }
    setOtpReady(true)
  }, [])

  const email = payload?.user?.email != null ? String(payload.user.email) : ''

  const onResend = useCallback(async () => {
    if (!payload?.user) return
    setResendBusy(true)
    setError(null)
    setInfo(null)
    try {
      const messageId = await sendLoginOtpChallenge(payload.user)
      const next = { ...payload, messageId }
      persistPendingOtp(next)
      setPayload(next)
      setInfo('We sent a new code to your email.')
    } catch {
      setError('Could not resend the code. Try again shortly.')
    } finally {
      setResendBusy(false)
    }
  }, [payload])

  const onSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!payload?.user || !payload.messageId) return
    const digits = code.replace(/\D/g, '')
    if (digits.length !== 6) {
      setError('Enter the 6-digit code from your email.')
      return
    }
    setBusy(true)
    setError(null)
    try {
      await authService.verifyOtp({
        userId: payload.user.user_id as number | string,
        messageId: payload.messageId,
        code: digits,
      })
      const user = payload.user as ApiUser
      clearPendingOtp()
      await establishSessionAndNavigate(user, navigate, {
        token: typeof payload.token === 'string' ? payload.token : undefined,
        to: payload.redirectTo,
      })
    } catch {
      setError('That code is invalid or expired. Request a new one below.')
    } finally {
      setBusy(false)
    }
  }

  const footer = (
    <p className="text-sm text-neutral-500">
      <Link to="/login" className="font-medium text-green-300 transition hover:text-green-200">
        Use a different account
      </Link>
    </p>
  )

  if (!otpReady) {
    return (
      <AuthPanel
        eyebrow="Two-factor verification"
        title="Preparing your security challenge"
        subtitle="Please wait while we load your verification request."
      >
        <p className="text-sm text-neutral-500">Preparing your session...</p>
      </AuthPanel>
    )
  }

  if (payload === null) {
    return (
      <AuthPanel
        eyebrow="Verification unavailable"
        title="This verification request is no longer active"
        subtitle="Open the sign-in page and enter your password again to receive a fresh code."
        footer={footer}
      >
        <Link to="/login" className={`${authPrimaryButtonClass} inline-flex text-center no-underline`}>
          Back to sign in
        </Link>
      </AuthPanel>
    )
  }

  const contextRail = (
    <>
      <AuthContextBlock
        eyebrow="Security check"
        title="We verify sign-in before opening the workspace."
        body="The account flow remains unchanged: verify the one-time code, then continue into the same dashboard and funding environment."
        iconClass="fi fi-rr-shield-check"
      >
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
          <AuthMetric label="Delivery" value="Email OTP" accent="text-green-300" />
          <AuthMetric label="Code length" value="6 digits" />
        </div>
      </AuthContextBlock>

      <AuthContextBlock
        eyebrow="Verification tips"
        title="Use the latest code only"
        iconClass="fi fi-rr-badge-check"
      >
        <AuthRailList
          items={[
            'Codes expire quickly for security.',
            'Request a new code if the latest one does not arrive.',
            'After verification, you will return to the original destination automatically.',
          ]}
        />
      </AuthContextBlock>
    </>
  )

  return (
    <AuthPanel
      eyebrow="Two-factor verification"
      title="Confirm it is really you"
      subtitle={`Enter the one-time code we sent to ${email || 'your email'}.`}
      contextRail={contextRail}
      footer={footer}
    >
      <form onSubmit={onSubmit} className="space-y-5">
        {info ? <AuthAlert tone="success">{info}</AuthAlert> : null}
        {error ? <AuthAlert tone="danger">{error}</AuthAlert> : null}

        <div>
          <label htmlFor="otp-code" className="sr-only">
            One-time code
          </label>
          <input
            id="otp-code"
            type="text"
            inputMode="numeric"
            autoComplete="one-time-code"
            maxLength={6}
            value={code}
            onChange={(event) => setCode(event.target.value.replace(/\D/g, '').slice(0, 6))}
            className="w-full rounded-2xl border border-neutral-800 bg-neutral-900/75 px-4 py-4 text-center font-mono text-2xl tracking-[0.35em] text-neutral-100 placeholder:text-neutral-600 transition-colors focus:border-green-500/30 focus:outline-none focus:ring-1 focus:ring-green-500/20"
            placeholder="000000"
          />
        </div>

        <button type="submit" disabled={busy} className={authPrimaryButtonClass}>
          {busy ? 'Verifying...' : 'Verify and continue'}
        </button>

        <button
          type="button"
          disabled={resendBusy}
          onClick={() => void onResend()}
          className={authSecondaryButtonClass}
        >
          {resendBusy ? 'Sending...' : 'Resend code'}
        </button>
      </form>
    </AuthPanel>
  )
}
