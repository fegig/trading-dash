import { Link, useLocation, useNavigate } from 'react-router'
import { useEffect, useState } from 'react'
import * as authService from '@/services/authService'
import { getRandomString } from '@/util/random'
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

  const userId = (location.state as { userId?: number } | null)?.userId

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
    const state = location.state as {
      email?: string
      userName?: string
      userId?: number
    } | null
    if (!state?.email || state.userId == null) return

    const token = getRandomString(62)
    authService
      .createVerifyToken(state.userId, token)
      .then(() => authService.sendVerificationEmail(state.email!, state.userId!, token, state.userName))
      .then((response) => {
        if (response.data === '200' || response.data === 200) setResMsg('Verification email sent.')
      })
      .catch(() => {})
  }

  if (location.state == null) {
    return <NotFoundPage />
  }

  const state = location.state as { email: string; userId: number }
  const email = state.email

  const contextRail = (
    <>
      <AuthContextBlock
        eyebrow="Email verification"
        title="Your account is almost ready."
        body="The verification step still uses the same token and polling logic. The redesign simply makes the state clearer and calmer."
        iconClass="fi fi-rr-envelope"
      />

      <AuthContextBlock eyebrow="What to do" title="Before you continue" iconClass="fi fi-rr-time-forward">
        <AuthRailList
          items={[
            'Open the latest verification email only.',
            'Check spam or promotions folders if it does not arrive quickly.',
            'Return here automatically after the address is confirmed.',
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
        <AuthAlert tone="neutral">
          <p className="flex gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-green-500/10 text-green-300">
              <i className="fi fi-rr-envelope text-lg" />
            </span>
            <span>
              Verification links expire for security. If the latest email no longer works, request a
              new one below.
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
