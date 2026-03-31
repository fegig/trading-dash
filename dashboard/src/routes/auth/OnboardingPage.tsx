import { Link, useLocation, useNavigate } from 'react-router'
import { useEffect, useMemo, useRef, useState } from 'react'
import { useShallow } from 'zustand/react/shallow'
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
import { startSession } from '@/util/establishSession'
import { useAuthStore, useVerificationStore, type ApiUser } from '@/stores'
import { successToast, errorToast } from '@/components/common/sweetAlerts'
import { formatDateWithTime } from '@/util/time'
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

function documentStatusClass(status: 'approved' | 'review' | 'missing') {
  switch (status) {
    case 'approved':
      return 'bg-green-500/10 text-green-300'
    case 'review':
      return 'bg-amber-500/10 text-amber-300'
    default:
      return 'bg-rose-500/10 text-rose-300'
  }
}

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
          body="Accurate contact details help with security alerts and account recovery."
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
              'Use the name you want shown on your account.',
              'Use a valid international phone number.',
              'Next you will choose country and display currency.',
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
          body="Your country and preferred fiat apply across balances and reports in the app."
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
              'Balances and market figures use your chosen fiat.',
              'Wallet views follow this preference.',
              'Then you choose whether to verify identity now or later.',
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
        title="Identity documents are optional here."
        body="Skip straight to the dashboard or expand uploads if you already have files ready. Everything can be done later under Dashboard → Verification."
        iconClass="fi fi-rr-shield-check"
      >
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
          <AuthMetric label="Default" value="Continue without uploading" accent="text-green-300" />
          <AuthMetric label="Optional" value="Upload ID / address now" />
        </div>
      </AuthContextBlock>

      <AuthContextBlock eyebrow="Session" title="How sign-in works" iconClass="fi fi-rr-apps">
        <AuthRailList
          items={[
            'Your Bearer token stays in the browser and is sent on API requests.',
            'We also set a secure session cookie when you finish onboarding so both work together.',
            'Two-factor login still applies at sign-in if it is enabled on your account.',
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
  const [displayName, setDisplayName] = useState('')
  const [phone, setPhone] = useState<string | undefined>(undefined)
  const [country, setCountry] = useState<string | undefined>(undefined)
  const [currencyId, setCurrencyId] = useState<number | null>(null)
  const [fiats, setFiats] = useState<Array<{ id: number; name: string; symbol: string }>>([])
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [uploadBusy, setUploadBusy] = useState(false)
  /** Optional uploads collapsed by default — user can skip and verify later. */
  const [showDocUpload, setShowDocUpload] = useState(false)

  const {
    documents,
    selectedDocumentId,
    loadVerification,
    selectDocument,
    uploadVerificationFile,
    downloadVerificationFile,
  } = useVerificationStore(
    useShallow((s) => ({
      documents: s.documents,
      selectedDocumentId: s.selectedDocumentId,
      loadVerification: s.loadVerification,
      selectDocument: s.selectDocument,
      uploadVerificationFile: s.uploadVerificationFile,
      downloadVerificationFile: s.downloadVerificationFile,
    }))
  )

  const selectedDocument =
    documents.find((d) => d.id === selectedDocumentId) ?? documents[0] ?? null

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

  useEffect(() => {
    if (step !== 2 || !showDocUpload) return
    void loadVerification(true)
  }, [step, showDocUpload, loadVerification])

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
      persistPendingOtp({ user, messageId, token, redirectTo, welcomeToast: true })
      navigate('/login/otp', { replace: true })
      return
    }
    await startSession(user, navigate, {
      token,
      to: redirectTo,
      welcomeToast: true,
      requestWebSession: true,
    })
  }

  const runStep1 = async (event: React.FormEvent) => {
    event.preventDefault()
    setError(null)
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
      })
      await authService.addAdminWallet()
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
      const token =
        (typeof window !== 'undefined' ? localStorage.getItem('token') : null) ??
        (typeof state?.apiToken === 'string' ? state.apiToken : null)

      if (token) {
        const name = displayName.trim()
        const { firstName, lastName } = splitDisplayName(name)
        const user: ApiUser = {
          user_id: userId,
          email,
          verificationStatus: '1',
          currency_id: currencyId ?? '',
          firstName,
          lastName: lastName || firstName,
          phone: phone ?? '',
          country: country ?? '',
          token,
        }
        if (!userNeedsOnboarding(user)) {
          await finishWithSession(user, token, redirectTo)
          return
        }
        setError('Something is incomplete. Go back and confirm profile and currency, then try again.')
        return
      }

      setError(
        'Your sign-in session expired. Open the login page and sign in with the email and password you used to register.'
      )
    } catch {
      setError('Something went wrong. Try the login page with your email and password.')
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
        subtitle="Add your name and phone. You already chose a password when you registered."
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
      title="Almost done"
      subtitle="You can open the dashboard now. Identity documents are optional — add them here or later under Dashboard → Verification."
      progress={<OnboardingProgress step={step} />}
      contextRail={onboardingContext(step)}
    >
      <div className="space-y-5">
        {error ? <AuthAlert tone="danger">{error}</AuthAlert> : null}

        <AuthAlert tone="neutral">
          <p className="text-sm text-neutral-300">
            <strong className="text-neutral-200">Skipping uploads is fine.</strong> Your account stays on
            standard limits until you complete verification in the app.
          </p>
        </AuthAlert>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <button
            type="button"
            disabled={busy}
            onClick={() => void completeOnboardingSignIn()}
            className={authPrimaryButtonClass}
          >
            {busy ? 'Opening workspace…' : 'Continue to dashboard'}
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={() => setShowDocUpload((v) => !v)}
            className={authSecondaryButtonClass}
          >
            {showDocUpload ? 'Hide optional uploads' : 'Upload documents now (optional)'}
          </button>
        </div>

        {showDocUpload ? (
          <div className="rounded-2xl border border-neutral-800 bg-neutral-900/40 p-4">
            <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-neutral-500">
              Optional — verification documents
            </div>
            <div className="mt-3 space-y-2">
              {documents.map((document) => (
                <button
                  key={document.id}
                  type="button"
                  onClick={() => selectDocument(document.id)}
                  className={`w-full rounded-2xl border px-3 py-3 text-left text-sm transition ${
                    selectedDocument?.id === document.id
                      ? 'border-green-500/30 bg-green-500/5 text-green-100'
                      : 'border-neutral-800 bg-neutral-950/60 text-neutral-300'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <span className="font-medium">{document.title}</span>
                    <span
                      className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] capitalize ${documentStatusClass(document.status)}`}
                    >
                      {document.status}
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-neutral-500">{document.subtitle}</p>
                </button>
              ))}
            </div>

            {selectedDocument ? (
              <div className="mt-4 space-y-3 rounded-2xl border border-neutral-800 bg-neutral-950/50 p-4">
                <div className="text-xs text-neutral-500">
                  Last update: {formatDateWithTime(selectedDocument.updatedAt)}
                </div>
                {selectedDocument.hasFile ? (
                  <div className="text-xs text-neutral-400">
                    File: {selectedDocument.originalFilename ?? 'uploaded'}
                  </div>
                ) : null}
                <input
                  ref={fileInputRef}
                  type="file"
                  className="hidden"
                  accept=".pdf,image/jpeg,image/png,image/webp"
                  onChange={(e) => {
                    const file = e.target.files?.[0]
                    e.target.value = ''
                    if (!file || !selectedDocument) return
                    setUploadBusy(true)
                    void uploadVerificationFile(selectedDocument.id, file)
                      .then((r) => {
                        if (r.ok) successToast('Document uploaded for review')
                        else errorToast(r.error ?? 'Upload failed')
                      })
                      .finally(() => setUploadBusy(false))
                  }}
                />
                <div className="flex flex-col gap-2 sm:flex-row">
                  <button
                    type="button"
                    disabled={uploadBusy}
                    onClick={() => fileInputRef.current?.click()}
                    className={`${authSecondaryButtonClass} sm:flex-1`}
                  >
                    {uploadBusy ? 'Uploading…' : selectedDocument.hasFile ? 'Replace file' : 'Upload file'}
                  </button>
                  {selectedDocument.hasFile ? (
                    <button
                      type="button"
                      onClick={() =>
                        void downloadVerificationFile(
                          selectedDocument.id,
                          selectedDocument.originalFilename ?? `${selectedDocument.id}-document`
                        ).then((r) => {
                          if (!r.ok) errorToast(r.error ?? 'Download failed')
                        })
                      }
                      className={`${authSecondaryButtonClass} sm:flex-1`}
                    >
                      Download copy
                    </button>
                  ) : null}
                </div>
                <p className="text-[10px] text-neutral-600">
                  JPEG, PNG, WebP, or PDF. Max 10 MB (same limits as Verification in the dashboard).
                </p>
              </div>
            ) : null}
          </div>
        ) : null}
      </div>
    </AuthPanel>
  )
}
