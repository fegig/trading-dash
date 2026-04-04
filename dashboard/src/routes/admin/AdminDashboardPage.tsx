import { useEffect, useState } from 'react'
import { Link } from 'react-router'
import { getAdminStats, type AdminStats } from '../../services/adminService'

function KpiCard({
  label,
  value,
  icon,
  color,
  to,
}: {
  label: string
  value: number | string
  icon: string
  color: string
  to?: string
}) {
  const inner = (
    <div
      className={`rounded-xl border p-5 flex items-center gap-4 transition-colors ${color}`}
    >
      <div className="w-11 h-11 rounded-lg bg-current/10 flex items-center justify-center shrink-0">
        <i className={`fi ${icon} text-xl`} />
      </div>
      <div>
        <p className="text-xs text-neutral-400 font-medium uppercase tracking-wide">{label}</p>
        <p className="text-2xl font-bold mt-0.5 text-white">{value}</p>
      </div>
    </div>
  )
  return to ? <Link to={to}>{inner}</Link> : inner
}

function QuickAction({
  label,
  icon,
  to,
  color,
}: {
  label: string
  icon: string
  to: string
  color: string
}) {
  return (
    <Link
      to={to}
      className={`flex items-center gap-3 p-4 rounded-xl border border-neutral-800 hover:border-neutral-600 bg-neutral-900/50 transition-colors group ${color}`}
    >
      <div className="w-9 h-9 rounded-lg bg-current/10 flex items-center justify-center shrink-0">
        <i className={`fi ${icon} text-base`} />
      </div>
      <span className="text-sm font-medium text-neutral-200 group-hover:text-white transition-colors">
        {label}
      </span>
      <i className="fi fi-rr-angle-right text-xs text-neutral-600 ml-auto group-hover:text-neutral-400 transition-colors" />
    </Link>
  )
}

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<AdminStats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getAdminStats()
      .then(setStats)
      .catch(() => null)
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-amber-400">Admin Dashboard</h1>
        <p className="text-sm text-neutral-400 mt-1">Platform overview and quick actions</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="rounded-xl border border-neutral-800 p-5 h-24 animate-pulse bg-neutral-900/50" />
          ))
        ) : (
          <>
            <KpiCard
              label="Total Users"
              value={stats?.totalUsers ?? 0}
              icon="fi-rr-users"
              color="text-blue-400 border-blue-500/20 bg-blue-500/5"
              to="/admin/users"
            />
            <KpiCard
              label="Open Trades"
              value={stats?.openTrades ?? 0}
              icon="fi-rr-chart-candlestick"
              color="text-green-400 border-green-500/20 bg-green-500/5"
              to="/admin/trades"
            />
            <KpiCard
              label="Trading Bots"
              value={stats?.totalBots ?? 0}
              icon="fi-rr-robot"
              color="text-purple-400 border-purple-500/20 bg-purple-500/5"
              to="/admin/bots"
            />
            <KpiCard
              label="Active Bot Subs"
              value={stats?.activeBotSubscriptions ?? 0}
              icon="fi-rr-time-forward"
              color="text-amber-400 border-amber-500/20 bg-amber-500/5"
            />
          </>
        )}
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="text-sm font-semibold text-neutral-400 uppercase tracking-wider mb-3">
          Quick Actions
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          <QuickAction
            label="Manage Users"
            icon="fi-rr-users"
            to="/admin/users"
            color="text-blue-400"
          />
          <QuickAction
            label="Create Trade"
            icon="fi-rr-add"
            to="/admin/trades"
            color="text-green-400"
          />
          <QuickAction
            label="Add Trading Bot"
            icon="fi-rr-robot"
            to="/admin/bots"
            color="text-purple-400"
          />
          <QuickAction
            label="Add Copy Trader"
            icon="fi-rr-copy-alt"
            to="/admin/copy-traders"
            color="text-cyan-400"
          />
          <QuickAction
            label="Add Investment"
            icon="fi-rr-chart-pie"
            to="/admin/investments"
            color="text-rose-400"
          />
        </div>
      </div>
    </div>
  )
}
