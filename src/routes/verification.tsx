import { Link } from 'react-router'
import { useUserStore } from '../stores'

const steps = [
  { title: 'Identity', body: 'Government ID and a live selfie match.', done: true },
  { title: 'Proof of address', body: 'Utility bill or bank statement (last 90 days).', done: false },
  { title: 'Review', body: 'Our team typically responds within 1–2 business days.', done: false },
]

export default function VerificationPage() {
  const status = useUserStore((s) => s.user?.verificationStatus)

  return (
    <div className="p-6 max-w-3xl space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-neutral-100">Verification</h1>
        <p className="text-sm text-neutral-500 mt-2">
          Complete KYC to unlock higher limits and external trading tools.
        </p>
        <p className="text-xs text-neutral-600 mt-2">
          Current status:{' '}
          <span className="text-green-400/90">
            {status === '3' ? 'Verified' : status === '2' ? 'Under review' : 'Action required'}
          </span>
        </p>
      </div>

      <ol className="space-y-4">
        {steps.map((s, i) => (
          <li
            key={s.title}
            className="gradient-background p-4 rounded-xl flex gap-4 items-start border border-neutral-800/80"
          >
            <div
              className={`w-8 h-8 rounded-full grid place-items-center text-sm font-bold shrink-0 ${
                s.done ? 'bg-green-500/20 text-green-400' : 'bg-neutral-800 text-neutral-500'
              }`}
            >
              {i + 1}
            </div>
            <div>
              <h2 className="text-sm font-semibold text-neutral-200">{s.title}</h2>
              <p className="text-sm text-neutral-500 mt-1">{s.body}</p>
            </div>
          </li>
        ))}
      </ol>

      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          className="px-4 py-2 rounded-xl bg-green-500/20 text-green-400 text-sm hover:bg-green-500/30"
        >
          Start verification
        </button>
        <Link to="/help" className="text-sm text-neutral-400 hover:text-green-400 py-2">
          Why we ask for this
        </Link>
      </div>
    </div>
  )
}
