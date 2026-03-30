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
  AuthFieldLabel,
  AuthPanel,
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

export default function OnboardingPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const st = (location.state ?? null) as LocationState | null
  const authUser = useAuthStore((s) => s.user)

  const userId = st?.userId ?? authUser?.user_id
  const email = String(st?.email ?? authUser?.email ?? '')

  const [step, setStep] = useState(0)
  const [password, setPassword] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [phone, setPhone] = useState<string | undefined>(undefined)
  const [country, setCountry] = useState<string | undefined>(undefined)
  const [currencyId, setCurrencyId] = useState<number | null>(null)
  const [fiats, setFiats] = useState<Array<{ id: number; name: string; symbol: string }>>([])
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const prelim = st?.prelimUser ?? authUser

  useEffect(() => {
    if (!prelim) return
    const fn = typeof prelim.firstName === 'string' ? prelim.firstName : ''
    const ln = typeof prelim.lastName === 'string' ? prelim.lastName : ''
    if (fn || ln) setDisplayName(`${fn} ${ln}`.trim())
    if (typeof prelim.phone === 'string' && prelim.phone) setPhone(prelim.phone)
    if (typeof prelim.country === 'string' && prelim.country) setCountry(prelim.country)
    const cid = prelim.currency_id
    if (cid != null && cid !== '') setCurrencyId(Number(cid))
  }, [prelim])

  useEffect(() => {
    void authService.listFiats().then((r) => {
      const list = r.data?.data
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

  const finishWithSession = async (u: ApiUser, token?: string, redirectTo?: string) => {
    if (userRequiresTwoFactorLogin(u)) {
      const messageId = await sendLoginOtpChallenge(u)
      persistPendingOtp({ user: u, messageId, token, redirectTo })
      navigate('/login/otp', { replace: true })
      return
    }
    await establishSessionAndNavigate(u, navigate, { token, to: redirectTo })
  }

  const runStep1 = async (e: React.FormEvent) => {
    e.preventDefault()
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
        const d = err.response.data
        if (Array.isArray(d)) setError(d.join(' '))
        else if (typeof d === 'object' && d && 'message' in d) setError(String((d as { message: string }).message))
        else setError('Could not save your profile.')
      } else setError('Could not save your profile.')
    } finally {
      setBusy(false)
    }
  }

  const runStep2 = async (e: React.FormEvent) => {
    e.preventDefault()
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
      const res = await authService.loginWithPassword(email, password)
      const data = res.data
      const u = data?.user as ApiUser | undefined
      if (!u) {
        setError('Sign-in failed after setup. Try signing in from the login page.')
        setBusy(false)
        return
      }
      if (userNeedsOnboarding(u)) {
        setError('Your profile is still incomplete. Contact support if this persists.')
        setBusy(false)
        return
      }
      const token = typeof data?.token === 'string' ? data.token : st?.apiToken
      await finishWithSession(u, token, redirectTo)
    } catch {
      setError('Sign-in failed. Use the login page with your email and password.')
    } finally {
      setBusy(false)
    }
  }

  const stepIndicator = (
    <div className="mb-8 flex gap-2">
      {steps.map((label, i) => (
        <div key={label} className="flex flex-1 flex-col gap-1.5">
          <div
            className={`h-1 rounded-full ${i <= step ? 'bg-green-500' : 'bg-neutral-800'}`}
            aria-hidden
          />
          <span className="text-[10px] font-medium uppercase tracking-wider text-neutral-600">
            {label}
          </span>
        </div>
      ))}
    </div>
  )

  if (step === 0) {
    return (
      <AuthPanel
        title="Set up your profile"
        subtitle="Use the same password you chose at registration. We’ll save your name and phone for your workspace."
      >
        {stepIndicator}
        <form onSubmit={runStep1} className="space-y-5">
          {error ? (
            <div
              role="alert"
              className="rounded-xl border border-red-500/35 bg-red-500/10 px-4 py-3 text-sm text-red-200/90"
            >
              {error}
            </div>
          ) : null}

          <div>
            <AuthFieldLabel htmlFor="onb-name">Your name</AuthFieldLabel>
            <input
              id="onb-name"
              type="text"
              autoComplete="name"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              required
              className={authInputClass}
              placeholder="Jane Doe"
            />
          </div>

          <div>
            <AuthFieldLabel htmlFor="onb-phone">Phone</AuthFieldLabel>
            <div className="rounded-xl border border-neutral-800 bg-neutral-900/70 px-3 py-1 focus-within:border-green-500/40 focus-within:ring-1 focus-within:ring-green-500/30">
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
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={8}
              className={authInputClass}
              placeholder="Confirm your password"
            />
          </div>

          <button type="submit" disabled={busy} className={authPrimaryButtonClass}>
            {busy ? 'Saving…' : 'Continue'}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-neutral-500">
          <Link to="/login" className="text-neutral-400 hover:text-green-400">
            ← Back to sign in
          </Link>
        </p>
      </AuthPanel>
    )
  }

  if (step === 1) {
    return (
      <AuthPanel
        title="Currency & region"
        subtitle="Pick where you operate and your preferred fiat display for balances and reports."
      >
        {stepIndicator}
        <form onSubmit={runStep2} className="space-y-5">
          {error ? (
            <div
              role="alert"
              className="rounded-xl border border-red-500/35 bg-red-500/10 px-4 py-3 text-sm text-red-200/90"
            >
              {error}
            </div>
          ) : null}

          <div>
            <AuthFieldLabel htmlFor="onb-country">Country</AuthFieldLabel>
            <CountryDropdown
              id="onb-country"
              value={country ?? ''}
              onChange={(val) => setCountry(val)}
              className={`${authInputClass} text-neutral-100!`}
              aria-label="Country"
            />
          </div>

          <div>
            <div className="mb-1.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-neutral-500">
              Preferred currency
            </div>
            <ul className="max-h-52 space-y-1 overflow-y-auto rounded-xl border border-neutral-800 bg-neutral-900/40 p-2">
              {fiats.map((f) => (
                <li key={f.id}>
                  <button
                    type="button"
                    onClick={() => setCurrencyId(f.id)}
                    className={`flex w-full rounded-lg px-3 py-2.5 text-left text-sm transition ${
                      currencyId === f.id
                        ? 'bg-green-500/15 text-green-200 ring-1 ring-green-500/30'
                        : 'text-neutral-300 hover:bg-neutral-800/80'
                    }`}
                  >
                    {f.name}{' '}
                    <span className="ml-auto text-neutral-500">
                      {f.symbol.length > 1 ? f.symbol.substring(1, 2) : f.symbol}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          </div>

          <button type="submit" disabled={busy} className={authPrimaryButtonClass}>
            {busy ? 'Saving…' : 'Continue'}
          </button>
        </form>
      </AuthPanel>
    )
  }

  return (
    <AuthPanel
      title="Identity verification"
      subtitle="You can upload proof of identity later from your dashboard. Skip for now to open your workspace."
    >
      {stepIndicator}
      <div className="space-y-4">
        {error ? (
          <div
            role="alert"
            className="rounded-xl border border-red-500/35 bg-red-500/10 px-4 py-3 text-sm text-red-200/90"
          >
            {error}
          </div>
        ) : null}
        <p className="text-sm leading-relaxed text-neutral-500">
          Regulatory checks can be completed under <strong className="text-neutral-400">Settings</strong>{' '}
          → verification when you are ready.
        </p>
        <button
          type="button"
          disabled={busy}
          onClick={() => void completeOnboardingSignIn()}
          className={authPrimaryButtonClass}
        >
          {busy ? 'Opening workspace…' : 'Go to dashboard'}
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
