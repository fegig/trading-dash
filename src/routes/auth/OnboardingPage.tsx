import { Link, useLocation, useNavigate } from 'react-router'
import { useEffect, useMemo, useState } from 'react'
import { CountryDropdown } from 'react-country-region-selector'
import PhoneInput from 'react-phone-number-input'
import axios from 'axios'
import 'react-phone-number-input/style.css'
import * as authService from '@/services/authService'
import {
  persistPendingOtp,
  sendLoginOtpChallenge,
  splitDisplayName,
  userNeedsOnboarding,
  userRequiresTwoFactorLogin,
} from '@/util/authFlow'
import { establishSessionAndNavigate } from '@/util/establishSession'
import { useAuthStore, type ApiUser } from '@/stores'
import NotFoundPage from '../NotFound'
import {
  AuthAlert,
  AuthContextBlock,
  AuthFieldLabel,
  AuthMetric,
  AuthPanel,
  AuthRailList,
  authInputClass,
  authPrimaryButtonClass,
  authSecondaryButtonClass,
} from '@/components/auth/AuthPanel'

type LocationState = {
  userId?: number | string
  email?: string
  apiToken?: string
  prelimUser?: ApiUser
  resume?: boolean
}

const steps = ['Profile', 'Currency', 'Identity'] as const

function OnboardingProgress({ step }: { step: number }) {
  return (
    <div className="flex gap-2">
      {steps.map((label, index) => (
        <div key={label} className="flex flex-1 flex-col gap-2">
          <div className={`h-1 rounded-full ${index <= step ? 'bg-green-500' : 'bg-neutral-800'}`} aria-hidden />
          <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-neutral-500">
            {label}
          </span>
        </div>
      ))}
    </div>
  )
}

function onboardingContext(step: number) {
  if (step === 0) {
    return (
      <>
        <AuthContextBlock
          eyebrow="Profile setup"
          title="We save your name and phone before opening the full workspace."
          body="This keeps the account-opening flow aligned with the existing onboarding logic while presenting it more clearly."
          iconClass="fi fi-rr-id-badge"
        >
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
            <AuthMetric label="Current step" value="Profile details" accent="text-green-300" />
            <AuthMetric label="Next step" value="Region and currency" />
          </div>
        </AuthContextBlock>

        <AuthContextBlock eyebrow="Required now" title="Before you continue" iconClass="fi fi-rr-user">
          <AuthRailList
            items={[
              'Use the same password you chose when registering.',
              'Provide a valid international phone number.',
              'Your profile will continue through the existing onboarding sequence.',
            ]}
          />
        </AuthContextBlock>
      </>
    )
  }

  if (step === 1) {
    return (
      <>
        <AuthContextBlock
          eyebrow="Region setup"
          title="Choose how balances and reporting should be displayed."
          body="Country and fiat selection continue to use the same backend calls and wallet provisioning steps."
          iconClass="fi fi-rr-globe"
        >
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
            <AuthMetric label="Current step" value="Country and currency" accent="text-green-300" />
            <AuthMetric label="Next step" value="Identity readiness" />
          </div>
        </AuthContextBlock>

        <AuthContextBlock eyebrow="Platform outcome" title="What this unlocks" iconClass="fi fi-rr-wallet">
          <AuthRailList
            items={[
              'Balances and market figures display in your chosen fiat currency.',
              'Your wallet setup stays aligned with the account profile.',
              'You move directly into identity and workspace readiness next.',
            ]}
          />
        </AuthContextBlock>
      </>
    )
  }

  return (
    <>
      <AuthContextBlock
        eyebrow="Final step"
        title="Identity can be completed now or later from inside the dashboard."
        body="This step keeps the same decision points: skip into the workspace or head straight to verification."
        iconClass="fi fi-rr-shield-check"
      >
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
          <AuthMetric label="Current step" value="Identity readiness" accent="text-green-300" />
          <AuthMetric label="Destination" value="Dashboard or verification" />
        </div>
      </AuthContextBlock>

      <AuthContextBlock eyebrow="After onboarding" title="Account posture" iconClass="fi fi-rr-apps">
        <AuthRailList
          items={[
            'Enter the dashboard immediately if you want to complete identity later.',
            'Go straight to verification if you want higher readiness before funding.',
            'Two-factor login behavior remains unchanged if it is enabled on the account.',
          ]}
        />
      </AuthContextBlock>
    </>
  )
}

export default function OnboardingPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const state = (location.state ?? null) as LocationState | null
  const authUser = useAuthStore((store) => store.user)

  const userId = state?.userId ?? authUser?.user_id
  const email = String(state?.email ?? authUser?.email ?? '')

  const [step, setStep] = useState(0)
  const [password, setPassword] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [phone, setPhone] = useState<string | undefined>(undefined)
  const [country, setCountry] = useState<string | undefined>(undefined)
  const [currencyId, setCurrencyId] = useState<number | null>(null)
  const [fiats, setFiats] = useState<Array<{ id: number; name: string; symbol: string }>>([])
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const prelim = state?.prelimUser ?? authUser

  useEffect(() => {
    if (!prelim) return
    const firstName = typeof prelim.firstName === 'string' ? prelim.firstName : ''
    const lastName = typeof prelim.lastName === 'string' ? prelim.lastName : ''
    if (firstName || lastName) setDisplayName(`${firstName} ${lastName}`.trim())
    if (typeof prelim.phone === 'string' && prelim.phone) setPhone(prelim.phone)
    if (typeof prelim.country === 'string' && prelim.country) setCountry(prelim.country)
    const currency = prelim.currency_id
    if (currency != null && currency !== '') setCurrencyId(Number(currency))
  }, [prelim])

  useEffect(() => {
    void authService.listFiats().then((response) => {
      const list = response.data?.data
      if (Array.isArray(list)) setFiats(list)
    })
  }, [])

  const validEntry = useMemo(() => {
    if (userId == null || email === '') return false
    return true
  }, [userId, email])

  if (!validEntry) {
    return <NotFoundPage />
  }

  const finishWithSession = async (user: ApiUser, token?: string, redirectTo?: string) => {
    if (userRequiresTwoFactorLogin(user)) {
      const messageId = await sendLoginOtpChallenge(user)
      persistPendingOtp({ user, messageId, token, redirectTo })
      navigate('/login/otp', { replace: true })
      return
    }
    await establishSessionAndNavigate(user, navigate, { token, to: redirectTo })
  }

  const runStep1 = async (event: React.FormEvent) => {
    event.preventDefault()
    setError(null)
    if (password.length < 8) {
      setError('Password must be at least 8 characters.')
      return
    }
    const name = displayName.trim()
    if (name.length < 2) {
      setError('Enter your name (at least 2 characters).')
      return
    }
    if (!phone || phone.replace(/\s/g, '').length < 8) {
      setError('Enter a valid phone number in international format.')
      return
    }
    const { firstName, lastName } = splitDisplayName(name)
    setBusy(true)
    try {
      await authService.addUserBios({
        userId,
        firstName,
        lastName: lastName || firstName,
        phoneNumber: phone.replace(/\s/g, ''),
        password,
      })
      setStep(1)
    } catch (err: unknown) {
      if (axios.isAxiosError(err) && err.response?.data) {
        const data = err.response.data
        if (Array.isArray(data)) setError(data.join(' '))
        else if (typeof data === 'object' && data && 'message' in data) {
          setError(String((data as { message: string }).message))
        } else {
          setError('Could not save your profile.')
        }
      } else {
        setError('Could not save your profile.')
      }
    } finally {
      setBusy(false)
    }
  }

  const runStep2 = async (event: React.FormEvent) => {
    event.preventDefault()
    setError(null)
    if (!country || currencyId == null) {
      setError('Choose your country and a default currency.')
      return
    }
    setBusy(true)
    try {
      await authService.updateUserCurrency({
        country,
        currency_id: currencyId,
        userId: Number(userId),
      })
      await authService.addAdminWallet(Number(userId))
      setStep(2)
    } catch {
      setError('Could not save currency. Try again.')
    } finally {
      setBusy(false)
    }
  }

  const completeOnboardingSignIn = async (redirectTo?: string) => {
    setBusy(true)
    setError(null)
    try {
      const response = await authService.loginWithPassword(email, password)
      const data = response.data
      const user = data?.user as ApiUser | undefined
      if (!user) {
        setError('Sign-in failed after setup. Try signing in from the login page.')
        setBusy(false)
        return
      }
      if (userNeedsOnboarding(user)) {
        setError('Your profile is still incomplete. Contact support if this persists.')
        setBusy(false)
        return
      }
      const token = typeof data?.token === 'string' ? data.token : state?.apiToken
      await finishWithSession(user, token, redirectTo)
    } catch {
      setError('Sign-in failed. Use the login page with your email and password.')
    } finally {
      setBusy(false)
    }
  }

  const commonFooter = (
    <p className="text-sm text-neutral-500">
      <Link to="/login" className="font-medium text-green-300 transition hover:text-green-200">
        Back to sign in
      </Link>
    </p>
  )

  if (step === 0) {
    return (
      <AuthPanel
        eyebrow="Workspace setup"
        title="Set up your profile"
        subtitle="Use the same password you chose at registration. We will save your name and phone for the workspace."
        progress={<OnboardingProgress step={step} />}
        contextRail={onboardingContext(step)}
        footer={commonFooter}
      >
        <form onSubmit={runStep1} className="space-y-5">
          {error ? <AuthAlert tone="danger">{error}</AuthAlert> : null}

          <div>
            <AuthFieldLabel htmlFor="onb-name">Your name</AuthFieldLabel>
            <input
              id="onb-name"
              type="text"
              autoComplete="name"
              value={displayName}
              onChange={(event) => setDisplayName(event.target.value)}
              required
              className={authInputClass}
              placeholder="Jane Doe"
            />
          </div>

          <div>
            <AuthFieldLabel htmlFor="onb-phone">Phone</AuthFieldLabel>
            <div className="rounded-2xl border border-neutral-800 bg-neutral-900/75 px-3 py-1 transition-colors focus-within:border-green-500/30 focus-within:ring-1 focus-within:ring-green-500/20">
              <PhoneInput
                international
                defaultCountry="US"
                value={phone}
                onChange={setPhone}
                className="onboarding-phone flex w-full [&_.PhoneInputInput]:min-h-[44px] [&_.PhoneInputInput]:w-full [&_.PhoneInputInput]:border-0 [&_.PhoneInputInput]:bg-transparent [&_.PhoneInputInput]:text-sm [&_.PhoneInputInput]:text-neutral-100 [&_.PhoneInputInput]:outline-none [&_.PhoneInputInput]:placeholder:text-neutral-600"
                placeholder="e.g. +1 234 567 8900"
              />
            </div>
          </div>

          <div>
            <AuthFieldLabel htmlFor="onb-password">Account password</AuthFieldLabel>
            <input
              id="onb-password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
              minLength={8}
              className={authInputClass}
              placeholder="Confirm your password"
            />
          </div>

          <button type="submit" disabled={busy} className={authPrimaryButtonClass}>
            {busy ? 'Saving...' : 'Continue'}
          </button>
        </form>
      </AuthPanel>
    )
  }

  if (step === 1) {
    return (
      <AuthPanel
        eyebrow="Workspace setup"
        title="Currency and region"
        subtitle="Pick where you operate and your preferred fiat display for balances and reports."
        progress={<OnboardingProgress step={step} />}
        contextRail={onboardingContext(step)}
      >
        <form onSubmit={runStep2} className="space-y-5">
          {error ? <AuthAlert tone="danger">{error}</AuthAlert> : null}

          <div>
            <AuthFieldLabel htmlFor="onb-country">Country</AuthFieldLabel>
            <CountryDropdown
              id="onb-country"
              value={country ?? ''}
              onChange={(value) => setCountry(value)}
              className={authInputClass}
              aria-label="Country"
            />
          </div>

          <div>
            <div className="mb-1.5 text-[11px] font-semibold uppercase tracking-[0.16em] text-neutral-500">
              Preferred currency
            </div>
            <ul className="max-h-56 space-y-1 overflow-y-auto rounded-2xl border border-neutral-800 bg-neutral-900/40 p-2">
              {fiats.map((fiat) => (
                <li key={fiat.id}>
                  <button
                    type="button"
                    onClick={() => setCurrencyId(fiat.id)}
                    className={`flex w-full rounded-2xl px-3 py-3 text-left text-sm transition ${
                      currencyId === fiat.id
                        ? 'bg-green-500/12 text-green-100 ring-1 ring-green-500/25'
                        : 'text-neutral-300 hover:bg-neutral-800/80'
                    }`}
                  >
                    {fiat.name}
                    <span className="ml-auto text-neutral-500">
                      {fiat.symbol.length > 1 ? fiat.symbol.substring(1, 2) : fiat.symbol}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          </div>

          <button type="submit" disabled={busy} className={authPrimaryButtonClass}>
            {busy ? 'Saving...' : 'Continue'}
          </button>
        </form>
      </AuthPanel>
    )
  }

  return (
    <AuthPanel
      eyebrow="Workspace setup"
      title="Identity verification"
      subtitle="You can upload proof of identity now or continue into the dashboard and return from the verification page later."
      progress={<OnboardingProgress step={step} />}
      contextRail={onboardingContext(step)}
    >
      <div className="space-y-4">
        {error ? <AuthAlert tone="danger">{error}</AuthAlert> : null}

        <AuthAlert tone="neutral">
          Regulatory checks can be completed later under <strong className="text-neutral-300">Settings</strong> to unlock higher readiness.
        </AuthAlert>

        <button
          type="button"
          disabled={busy}
          onClick={() => void completeOnboardingSignIn()}
          className={authPrimaryButtonClass}
        >
          {busy ? 'Opening workspace...' : 'Go to dashboard'}
        </button>

        <button
          type="button"
          disabled={busy}
          onClick={() => void completeOnboardingSignIn('/dashboard/verification')}
          className={authSecondaryButtonClass}
        >
          Upload documents now
        </button>
      </div>
    </AuthPanel>
  )
}
