import { useParams, useNavigate } from 'react-router'
import { useEffect, useState } from 'react'
import * as authService from '@/services/authService'
import { useAuthStore, type ApiUser } from '@/stores'
import {
  AuthContextBlock,
  AuthPanel,
  AuthRailList,
  authPrimaryButtonClass,
  authSecondaryButtonClass,
} from '@/components/auth/AuthPanel'

function ConfirmEmailContext() {
  return (
    <>
      <AuthContextBlock
        eyebrow="Verification result"
        title="Email verification completes your sign-up."
        body="We validate your link, update your account, and guide you to the next step."
        iconClass="fi fi-rr-badge-check"
      />
      <AuthContextBlock eyebrow="Next step" title="After confirmation" iconClass="fi fi-rr-route">
        <AuthRailList
          items={[
            'Continue into onboarding if profile setup is still pending.',
            'Sign in if you prefer to finish setup later.',
            'Request a new verification email if the original link expired.',
          ]}
        />
      </AuthContextBlock>
    </>
  )
}

export default function ConfirmEmailPage() {
  const params = useParams<{ email: string; id: string; userId: string }>()
  const email = params.email ? decodeURIComponent(params.email) : ''
  const userId = params.userId
  const token = params.id
  const navigate = useNavigate()
  const [body, setBody] = useState<React.ReactNode>(null)

  useEffect(() => {
    if (!token || !userId) return
    let cancelled = false

    authService
      .verifyEmailAndStartSession(token, userId)
      .then((response) => {
        const status = response.status
        const body = response.data as { error?: string; user?: Record<string, unknown>; token?: string }
        return { status, body }
      })
      .then(async ({ status, body }) => {
        if (cancelled) return
        if (status >= 400 || body.error || !body.token || !body.user) {
          setBody(
            <AuthPanel
              eyebrow="Link expired"
              title="This verification link is no longer valid"
              subtitle="Request a fresh verification email from the sign-up flow or contact support."
              contextRail={<ConfirmEmailContext />}
            >
              <button
                type="button"
                onClick={() =>
                  navigate('/verify', {
                    state: { email, userId: Number(userId) || userId },
                  })
                }
                className={authPrimaryButtonClass}
              >
                Resend verification
              </button>
            </AuthPanel>
          )
          return
        }
        const prelimUser = { ...(body.user as ApiUser), token: body.token }
        useAuthStore.getState().login(prelimUser)
        setBody(
          <AuthPanel
            eyebrow="Email verified"
            title="Your address is confirmed"
            subtitle={`${email} is verified. Finish your profile setup or sign in when you are ready.`}
            contextRail={<ConfirmEmailContext />}
          >
            <div className="flex flex-col gap-3 sm:flex-row">
              <button
                type="button"
                onClick={() =>
                  navigate('/onboarding', {
                    replace: true,
                    state: {
                      userId,
                      email,
                      apiToken: body.token,
                      prelimUser: { ...prelimUser, token: body.token },
                    },
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
      })
      .catch(() => {
        if (!cancelled) {
          setBody(
            <AuthPanel
              eyebrow="Something went wrong"
              title="We could not validate this verification request"
              subtitle="Try again from the sign-in flow or request a fresh verification link."
              contextRail={<ConfirmEmailContext />}
            >
              <button
                type="button"
                onClick={() => navigate('/login')}
                className={authPrimaryButtonClass}
              >
                Back to sign in
              </button>
            </AuthPanel>
          )
        }
      })

    return () => {
      cancelled = true
    }
  }, [email, navigate, token, userId])

  return (
    <div className="flex min-h-[32vh] items-center justify-center">
      {body ?? (
        <AuthPanel
          eyebrow="Confirming email"
          title="Validating your verification request"
          subtitle="Please wait while we confirm the link and update your account status."
          contextRail={<ConfirmEmailContext />}
        >
          <p className="text-sm text-neutral-500">Validating your link...</p>
        </AuthPanel>
      )}
    </div>
  )
}
