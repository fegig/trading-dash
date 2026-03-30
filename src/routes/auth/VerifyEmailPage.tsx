import { Link, useLocation, useNavigate } from 'react-router'
import { useEffect, useState } from 'react'
import * as authService from '@/services/authService'
import { getRandomString } from '@/util/random'
import NotFoundPage from '../NotFound'
import { AuthPanel, authPrimaryButtonClass, authSecondaryButtonClass } from '@/components/auth/AuthPanel'

export default function VerifyEmailPage() {
  const items = useLocation()
  const navigate = useNavigate()
  const [resMsg, setResMsg] = useState<string | null>(null)
  const [verifiedStatus, setVerifiedStatus] = useState(false)

  const userId = (items.state as { userId?: number } | null)?.userId

  useEffect(() => {
    if (userId == null) return
    const id = window.setInterval(() => {
      authService
        .getVerificationStatus(userId)
        .then((response) => response.data?.data)
        .then((data) => {
          if (data === 1) setVerifiedStatus(true)
        })
        .catch(() => {})
    }, 10000)
    return () => clearInterval(id)
  }, [userId])

  const resendMail = () => {
    const st = items.state as {
      email?: string
      userName?: string
      userId?: number
    } | null
    if (!st?.email || st.userId == null) return

    const token = getRandomString(62)
    authService
      .createVerifyToken(st.userId, token)
      .then(() => authService.sendVerificationEmail(st.email!, st.userId!, token, st.userName))
      .then((res) => {
        if (res.data === '200' || res.data === 200) setResMsg('Verification email sent.')
      })
      .catch(() => {})
  }

  if (items.state == null) {
    return <NotFoundPage />
  }

  const st = items.state as { email: string; userId: number }
  const email = st.email

  if (verifiedStatus) {
    return (
      <AuthPanel
        title="Email confirmed"
        subtitle="Your address is verified. Complete your profile or sign in when you prefer."
      >
        <div className="flex flex-col gap-3 sm:flex-row">
          <button
            type="button"
            onClick={() =>
              navigate('/onboarding', {
                replace: true,
                state: { userId: st.userId, email: st.email },
              })
            }
            className={authPrimaryButtonClass}
          >
            Continue setup
          </button>
          <button
            type="button"
            onClick={() => navigate('/login?confirmed=1', { replace: true })}
            className={authSecondaryButtonClass}
          >
            Sign in
          </button>
        </div>
      </AuthPanel>
    )
  }

  return (
    <AuthPanel
      title="Confirm your email"
      subtitle={`We sent a message to ${email}. Open the link inside to finish setup.`}
    >
      <div className="space-y-6">
        <div className="rounded-xl border border-neutral-800 bg-neutral-900/50 px-4 py-4 text-sm text-neutral-400">
          <p className="flex gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-green-500/15 text-green-400">
              <i className="fi fi-rr-envelope text-lg" />
            </span>
            <span>
              Link expires for security. If it does, request a new email below. Check spam folders if
              you don&apos;t see it within a few minutes.
            </span>
          </p>
        </div>

        <button type="button" onClick={resendMail} className={authPrimaryButtonClass}>
          Resend email
        </button>
        {resMsg ? <p className="text-center text-sm text-green-400/90">{resMsg}</p> : null}

        <p className="text-center text-sm text-neutral-500">
          <Link to="/login" className="font-medium text-neutral-300 hover:text-green-400">
            ← Back to sign in
          </Link>
        </p>
      </div>
    </AuthPanel>
  )
}
