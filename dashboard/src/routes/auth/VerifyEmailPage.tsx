import { Link, useLocation, useNavigate } from 'react-router'
import { useEffect, useState } from 'react'
import * as authService from '@/services/authService'
import NotFoundPage from '../NotFound'
import {
  AuthAlert,
  AuthContextBlock,
  AuthPanel,
  AuthRailList,
  authPrimaryButtonClass,
  authSecondaryButtonClass,
} from '@/components/auth/AuthPanel'

export default function VerifyEmailPage() {
  const location = useLocation()
  const navigate = useNavigate()
  const [resMsg, setResMsg] = useState<string | null>(null)
  const [verifiedStatus, setVerifiedStatus] = useState(false)

  const userId = (location.state as { userId?: number | string } | null)?.userId

  useEffect(() => {
    if (userId == null || verifiedStatus) return

    const poll = () => {
      const email = (location.state as { email?: string } | null)?.email
      if (!email) return
      void authService
        .pollVerificationStatus(userId, email)
        .then((response) => response.data?.data)
        .then((data) => {
          if (Number(data) === 1) setVerifiedStatus(true)
        })
        .catch(() => {})
    }

    void poll()
    const id = window.setInterval(poll, 10000)
    return () => clearInterval(id)
  }, [userId, verifiedStatus, location.state])

  const resendMail = () => {
    const state = location.state as {
      email?: string
      userName?: string
      userId?: number | string
    } | null
    if (!state?.email || state.userId == null) return

    authService
      .sendVerificationEmail(state.email!, state.userId!, undefined, state.userName)
      .then((response) => {
        const d = response?.data as { ok?: boolean } | undefined
        if (d?.ok) setResMsg('Verification email sent.')
      })
      .catch(() => {})
  }

  if (location.state == null) {
    return <NotFoundPage />
  }

  const state = location.state as {
    email: string
    userId: number | string
    showWelcome?: boolean
  }
  const email = state.email

  const contextRail = (
    <>
      <AuthContextBlock
        eyebrow="Email verification"
        title="Your account is almost ready."
        body="Use the link we emailed you. It opens a secure confirmation page in this app."
        iconClass="fi fi-rr-envelope"
      />

      <AuthContextBlock eyebrow="What to do" title="Before you continue" iconClass="fi fi-rr-time-forward">
        <AuthRailList
          items={[
            'Open only the latest verification email.',
            'Check spam or promotions if nothing arrives within a few minutes.',
            'This page updates when your address is confirmed.',
          ]}
        />
      </AuthContextBlock>
    </>
  )

  if (verifiedStatus) {
    return (
      <AuthPanel
        eyebrow="Email confirmed"
        title="Your address is verified"
        subtitle="Finish your profile setup now or sign in and return later."
        contextRail={contextRail}
      >
        <div className="flex flex-col gap-3 sm:flex-row">
          <button
            type="button"
            onClick={() =>
              navigate('/onboarding', {
                replace: true,
                state: { userId: state.userId, email: state.email },
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
      eyebrow="Confirm your email"
      title="Verify your address before opening the workspace"
      subtitle={`We sent a verification message to ${email}. Open the link inside to finish setup.`}
      contextRail={contextRail}
      footer={
        <p className="text-sm text-neutral-500">
          <Link to="/login" className="font-medium text-green-300 transition hover:text-green-200">
            Back to sign in
          </Link>
        </p>
      }
    >
      <div className="space-y-6">
        {state.showWelcome ? (
          <AuthAlert tone="success">
            <p className="font-medium text-green-100">Welcome aboard — your account is created.</p>
            <p className="mt-1 text-sm text-neutral-300">
              Confirm your email with the link we sent, then continue setup from here.
            </p>
          </AuthAlert>
        ) : null}
        <AuthAlert tone="neutral">
          <p className="flex gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-green-500/10 text-green-300">
              <i className="fi fi-rr-envelope text-lg" />
            </span>
            <span>
              Links expire for security. If yours no longer works, request a new email below.
            </span>
          </p>
        </AuthAlert>

        <button type="button" onClick={resendMail} className={authPrimaryButtonClass}>
          Resend email
        </button>

        {resMsg ? <AuthAlert tone="success">{resMsg}</AuthAlert> : null}
      </div>
    </AuthPanel>
  )
}
