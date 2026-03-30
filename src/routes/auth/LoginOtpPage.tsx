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
import { AuthPanel, authPrimaryButtonClass, authSecondaryButtonClass } from '@/components/auth/AuthPanel'

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
    const p = readPendingOtp()
    if (!p?.user?.user_id || !p.messageId) {
      setPayload(null)
    } else {
      setPayload(p)
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

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
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
      const u = payload.user as ApiUser
      clearPendingOtp()
      await establishSessionAndNavigate(u, navigate, {
        token: typeof payload.token === 'string' ? payload.token : undefined,
        to: payload.redirectTo,
      })
    } catch {
      setError('That code is invalid or expired. Request a new one below.')
    } finally {
      setBusy(false)
    }
  }

  if (!otpReady) {
    return (
      <AuthPanel title="Two-factor verification" subtitle="Loading…">
        <p className="text-sm text-neutral-500">Preparing your session…</p>
      </AuthPanel>
    )
  }

  if (payload === null) {
    return (
      <AuthPanel
        title="Verification unavailable"
        subtitle="Open the sign-in page and enter your password again to receive a fresh code."
      >
        <Link to="/login" className={authPrimaryButtonClass + ' block text-center'}>
          Back to sign in
        </Link>
      </AuthPanel>
    )
  }

  return (
    <AuthPanel
      title="Two-factor verification"
      subtitle={`Enter the one-time code we sent to ${email || 'your email'}.`}
    >
      <form onSubmit={onSubmit} className="space-y-5">
        {info ? (
          <div className="rounded-xl border border-green-500/25 bg-green-500/10 px-4 py-3 text-sm text-green-200/90">
            {info}
          </div>
        ) : null}
        {error ? (
          <div
            role="alert"
            className="rounded-xl border border-red-500/35 bg-red-500/10 px-4 py-3 text-sm text-red-200/90"
          >
            {error}
          </div>
        ) : null}

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
            onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
            className="w-full rounded-xl border border-neutral-800 bg-neutral-900/70 px-4 py-4 text-center font-mono text-2xl tracking-[0.35em] text-neutral-100 placeholder:text-neutral-600 focus:border-green-500/40 focus:outline-none focus:ring-1 focus:ring-green-500/30"
            placeholder="••••••"
          />
        </div>

        <button type="submit" disabled={busy} className={authPrimaryButtonClass}>
          {busy ? 'Verifying…' : 'Verify and continue'}
        </button>

        <button
          type="button"
          disabled={resendBusy}
          onClick={() => void onResend()}
          className={authSecondaryButtonClass}
        >
          {resendBusy ? 'Sending…' : 'Resend code'}
        </button>
      </form>

      <p className="mt-8 text-center text-sm text-neutral-500">
        <Link to="/login" className="font-medium text-neutral-300 hover:text-green-400">
          ← Use a different account
        </Link>
      </p>
    </AuthPanel>
  )
}
