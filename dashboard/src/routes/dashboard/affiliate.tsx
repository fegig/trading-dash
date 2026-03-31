import { useEffect, useState } from 'react'
import { useUserStore } from '@/stores'

export default function AffiliatePage() {
  const userId = useUserStore((s) => s.user?.user_id) ?? 'demo-user'
  const [copied, setCopied] = useState(false)
  const link = `${typeof window !== 'undefined' ? window.location.origin : ''}/register?ref=${userId}`

  useEffect(() => {
    if (!copied) return
    const t = setTimeout(() => setCopied(false), 2000)
    return () => clearTimeout(t)
  }, [copied])

  return (
    <div className="p-6 space-y-8 max-w-5xl">
      <div>
        <h1 className="text-2xl font-bold text-neutral-100">Affiliate program</h1>
        <p className="text-sm text-neutral-500 mt-2">
          Share your link and earn rewards when referred users trade.
        </p>
      </div>

      <div className="gradient-background p-6 rounded-xl border border-green-500/10">
        <h2 className="text-sm font-semibold text-neutral-300 mb-3">Your referral link</h2>
        <div className="flex flex-col sm:flex-row gap-3">
          <code className="flex-1 text-xs text-neutral-400 bg-neutral-900/80 px-3 py-2 rounded-lg break-all">
            {link}
          </code>
          <button
            type="button"
            onClick={async () => {
              await navigator.clipboard.writeText(link)
              setCopied(true)
            }}
            className="px-4 py-2 rounded-xl bg-green-500/20 text-green-400 text-sm hover:bg-green-500/30"
          >
            {copied ? 'Copied' : 'Copy'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: 'Referrals', value: '—', hint: 'Wire to API' },
          { label: 'Rewards pending', value: '—', hint: 'USDT' },
          { label: 'Tier', value: 'Standard', hint: 'Upgrade path TBD' },
        ].map((c) => (
          <div key={c.label} className="gradient-background p-4 rounded-xl">
            <div className="text-xs text-neutral-500 uppercase">{c.label}</div>
            <div className="text-xl font-semibold text-neutral-100 mt-1">{c.value}</div>
            <div className="text-xs text-neutral-600 mt-1">{c.hint}</div>
          </div>
        ))}
      </div>

      <div className="gradient-background p-0 rounded-xl overflow-hidden">
        <div className="px-4 py-3 border-b border-neutral-800 text-sm font-semibold text-neutral-300">
          Referrals
        </div>
        <div className="p-8 text-center text-sm text-neutral-500">
          Referral rows will load from <code className="text-neutral-400">affiliateService</code>{' '}
          when the endpoint is ready.
        </div>
      </div>
    </div>
  )
}
