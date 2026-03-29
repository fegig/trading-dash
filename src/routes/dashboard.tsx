import { Link } from 'react-router'
import { useEffect, useMemo, useState } from 'react'
import PairBanner, { MarketData } from '@/components/dashboard/PairBanner'
import MiniTradeHistory from '@/components/dashboard/MiniTradeHistory'
import GoalProgressCard from '@/components/dashboard/GoalProgressCard'
import { useUserStore, useCurrencyStore } from '@/stores'
import * as userService from '@/services/userService'
import { formatNumber } from '@/util/formatCurrency'

function verificationLabel(status: string | undefined) {
  switch (status) {
    case '3':
      return { text: 'Verified', className: 'text-green-400 bg-green-500/10 border-green-500/20' }
    case '2':
      return { text: 'Under review', className: 'text-amber-400 bg-amber-500/10 border-amber-500/20' }
    case '1':
      return { text: 'Unverified', className: 'text-neutral-400 bg-neutral-800 border-neutral-700' }
    default:
      return { text: 'Unknown', className: 'text-red-400 bg-red-500/10 border-red-500/20' }
  }
}

export default function DashboardPage() {
  const user = useUserStore((s) => s.user)
  const currency = useCurrencyStore((s) => s.currency)
  const [equity, setEquity] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)

  const badge = verificationLabel(user?.verificationStatus)

  useEffect(() => {
    let cancelled = false
    const uid = user?.user_id ?? 'demo-user'
    ;(async () => {
      setLoading(true)
      const bal = await userService.getOtherBalance(uid)
      if (!cancelled) {
        setEquity(bal?.fiat ?? 12480.5)
        setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [user?.user_id])

  const [, setSymbol] = useState<MarketData | null>(null)

  const metrics = useMemo(
    () => [
      {
        label: 'Est. equity',
        value: equity != null ? `${currency.symbol}${formatNumber(equity, 2)}` : '—',
        sub: 'Spot + wallet',
      },
      {
        label: '24h PnL',
        value: '+0.00%',
        sub: 'Demo',
      },
      {
        label: 'Open orders',
        value: '—',
        sub: 'See Trade Center',
      },
    ],
    [equity, currency.symbol]
  )

  return (
    <div className="p-6 space-y-8">
      <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-neutral-100 tracking-tight">
            Welcome back{user?.firstName ? `, ${user.firstName}` : ''}
          </h1>
          <p className="text-sm text-neutral-500 mt-2 max-w-xl">
            Your command center for markets, positions, and account health.
          </p>
          <span
            className={`inline-flex mt-4 text-xs px-3 py-1 rounded-full border ${badge.className}`}
          >
            {badge.text}
          </span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 w-full lg:max-w-2xl">
          {metrics.map((m) => (
            <div key={m.label} className="gradient-background p-4 rounded-xl">
              <div className="text-xs text-neutral-500 uppercase tracking-wide">{m.label}</div>
              <div className="text-lg font-semibold text-neutral-100 mt-1 tabular-nums">
                {loading ? <span className="inline-block h-6 w-24 bg-neutral-800 rounded animate-pulse" /> : m.value}
              </div>
              <div className="text-xs text-neutral-600 mt-1">{m.sub}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Link
          to="/"
          className="gradient-background p-4 rounded-xl hover:border-green-500/30 border border-transparent transition-colors text-center"
        >
          <i className="fi fi-rr-chart-line text-xl text-green-400 mb-2" />
          <div className="text-sm font-medium text-neutral-200">Live trading</div>
        </Link>
        <Link
          to="/trade-center"
          className="gradient-background p-4 rounded-xl hover:border-green-500/30 border border-transparent transition-colors text-center"
        >
          <i className="fi fi-rr-apps text-xl text-green-400 mb-2" />
          <div className="text-sm font-medium text-neutral-200">Trade Center</div>
        </Link>
        <Link
          to="/wallet"
          className="gradient-background p-4 rounded-xl hover:border-green-500/30 border border-transparent transition-colors text-center"
        >
          <i className="fi fi-rr-wallet text-xl text-green-400 mb-2" />
          <div className="text-sm font-medium text-neutral-200">Wallet</div>
        </Link>
        <Link
          to="/trades"
          className="gradient-background p-4 rounded-xl hover:border-green-500/30 border border-transparent transition-colors text-center"
        >
          <i className="fi fi-rr-time-past text-xl text-green-400 mb-2" />
          <div className="text-sm font-medium text-neutral-200">All trades</div>
        </Link>
      </div>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-neutral-400 uppercase tracking-wide">
          Markets
        </h2>
        <PairBanner setSymbol={setSymbol} />
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-neutral-400 uppercase tracking-wide">
              Activity
            </h2>
            <Link to="/trades" className="text-xs text-green-400 hover:text-green-300">
              View all trades
            </Link>
          </div>
          <MiniTradeHistory />
        </section>
        <GoalProgressCard goalPct={72} />
      </div>

      <section className="gradient-background p-5 rounded-xl border border-neutral-800/80">
        <h3 className="text-sm font-semibold text-neutral-200 mb-2">Announcements</h3>
        <p className="text-sm text-neutral-500">
          Platform updates and risk reminders will appear here. You can wire this strip to a CMS
          or static config when ready.
        </p>
      </section>
    </div>
  )
}
