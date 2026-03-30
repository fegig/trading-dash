import { useParams, useNavigate } from 'react-router'
import { useEffect, useState } from 'react'
import * as authService from '@/services/authService'
import { AuthPanel, authPrimaryButtonClass } from '@/components/auth/AuthPanel'

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
      .verifyEmailToken(token, userId)
      .then((r) => r.data as boolean)
      .then(async (valid) => {
        if (cancelled) return
        if (!valid) {
          setBody(
            <AuthPanel
              title="Link expired"
              subtitle="Request a fresh verification email from the sign-up flow or contact support."
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
        try {
          const r2 = await authService.updateUserVerificationStatus(1, userId)
          const data = r2.data as boolean
          if (cancelled) return
          if (data) {
            setBody(
              <AuthPanel
                title="You’re verified"
                subtitle={`${email} is confirmed. Finish your profile or sign in when you’re ready.`}
              >
                <div className="flex flex-col gap-3 sm:flex-row">
                  <button
                    type="button"
                    onClick={() =>
                      navigate('/onboarding', {
                        replace: true,
                        state: { userId, email },
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
        } catch {
          if (cancelled) return
          setBody(
            <AuthPanel title="Already verified" subtitle="You can sign in with your credentials.">
              <button
                type="button"
                onClick={() => navigate('/login', { replace: true })}
                className={authPrimaryButtonClass}
              >
                Sign in
              </button>
            </AuthPanel>
          )
        }
      })
      .catch(() => {
        if (!cancelled) {
          setBody(
            <AuthPanel title="Something went wrong" subtitle="Try again or request a new link.">
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
        <AuthPanel title="Confirming your email" subtitle="Please wait a moment.">
          <p className="text-sm text-neutral-500">Validating your link…</p>
        </AuthPanel>
      )}
    </div>
  )
}
