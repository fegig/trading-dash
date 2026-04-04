import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router'
import { useShallow } from 'zustand/react/shallow'
import AssetAvatar from '@/components/common/AssetAvatar'
import GradientBadge from '@/components/common/GradientBadge'
import GoalProgressCard from '@/components/dashboard/GoalProgressCard'
import MiniTradeHistory from '@/components/dashboard/MiniTradeHistory'
import PairBanner, { type MarketData } from '@/components/dashboard/PairBanner'
import type { GradientBadgeTone } from '@/components/common/gradientBadgeTones'
import { useAuthStore, usePlatformStore, useTradeStore, useUserStore, useVerificationStore, useWalletStore } from '@/stores'
import { formatCurrency, formatLength, formatNumber } from '@/util/formatCurrency'
import { isSubscriptionActive } from '@/util/subscription'
import { formatDateWithTime } from '@/util/time'
import { paths } from '@/navigation/paths'

const TWO_FA_DISMISSED_KEY = 'td_2fa_prompt_dismissed'

function TwoFaBanner({ onDismiss }: { onDismiss: () => void }) {
  return (
    <div className="flex items-start gap-4 rounded-2xl border border-amber-500/25 bg-amber-500/8 p-4">
      <div className="mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-full bg-amber-500/15 text-amber-400">
        <i className="fi fi-rr-shield-exclamation text-base" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-amber-300">Secure your account with two-factor login</p>
        <p className="mt-1 text-xs leading-5 text-neutral-400">
          Two-factor authentication adds a one-time code challenge at sign-in.
          Enable it in Settings to protect against unauthorised access.
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          <Link
            to="/settings"
            className="rounded-full bg-amber-500/15 px-3 py-1.5 text-xs font-semibold text-amber-300 transition hover:bg-amber-500/25"
          >
            Enable 2FA in Settings
          </Link>
          <button
            type="button"
            onClick={onDismiss}
            className="rounded-full px-3 py-1.5 text-xs text-neutral-500 transition hover:text-neutral-300"
          >
            Dismiss
          </button>
        </div>
      </div>
    </div>
  )
}

function verificationBadge(status: string | undefined) {
  switch (status) {
    case '3':
      return { text: 'Verified', tone: 'green' as const }
    case '2':
      return { text: 'Under review', tone: 'amber' as const }
    case '1':
      return { text: 'Unverified', tone: 'neutral' as const }
    default:
      return { text: 'Unknown', tone: 'rose' as const }
  }
}

function DashboardMetric({
  label,
  value,
  subtext,
  accent,
  loading,
}: {
  label: string
  value: string
  subtext: string
  accent?: string
  loading?: boolean
}) {
  return (
    <div className="rounded-2xl border border-neutral-800 bg-neutral-950/60 p-4">
      <div className="text-[11px] uppercase tracking-[0.16em] text-neutral-500">{label}</div>
      <div className={`mt-2 text-lg font-semibold tabular-nums ${accent ?? 'text-neutral-100'}`}>
        {loading ? <span className="inline-block h-6 w-24 animate-pulse rounded bg-neutral-800" /> : value}
      </div>
      <div className="mt-2 text-xs text-neutral-500">{subtext}</div>
    </div>
  )
}

function ActionTile({
  to,
  iconClass,
  title,
  body,
}: {
  to: string
  iconClass: string
  title: string
  body: string
}) {
  return (
    <Link
      to={to}
      className="gradient-background rounded-2xl border border-neutral-800/80 p-4 transition-colors hover:border-green-500/25"
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-sm font-semibold text-neutral-100">{title}</div>
          <p className="mt-2 text-xs leading-5 text-neutral-500">{body}</p>
        </div>
        <span className="grid h-10 w-10 place-items-center rounded-full bg-green-500/10 text-green-400">
          <i className={`${iconClass} text-base`} />
        </span>
      </div>
    </Link>
  )
}

function AllocationRow({
  label,
  value,
  percentage,
  accentClass,
}: {
  label: string
  value: string
  percentage: number
  accentClass: string
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-3 text-sm">
        <span className="text-neutral-300">{label}</span>
        <span className="tabular-nums text-neutral-500">{value}</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-neutral-900">
        <div className={`h-full rounded-full ${accentClass}`} style={{ width: `${percentage}%` }} />
      </div>
    </div>
  )
}

function transactionTone(type: string): GradientBadgeTone {
  switch (type) {
    case 'deposit':
    case 'interest':
    case 'dividend':
      return 'green'
    case 'withdrawal':
      return 'rose'
    case 'transfer':
      return 'sky'
    default:
      return 'neutral'
  }
}

export default function DashboardPage() {
  const user = useUserStore((state) => state.user)
  const authUser = useAuthStore((state) => state.user)
  const userId = user?.user_id ?? 'demo-user'
  const badge = verificationBadge(user?.verificationStatus)
  const [, setSymbol] = useState<MarketData | null>(null)

  // 2FA recommendation banner — shown once until dismissed, hidden if already enabled
  const [show2faBanner, setShow2faBanner] = useState(() => {
    try {
      return localStorage.getItem(TWO_FA_DISMISSED_KEY) !== '1'
    } catch {
      return false
    }
  })
  const twoFaEnabled = authUser?.loginOtpEnabled === true
  const dismiss2faBanner = () => {
    try { localStorage.setItem(TWO_FA_DISMISSED_KEY, '1') } catch { /* ignore */ }
    setShow2faBanner(false)
  }

  const { trades, loading: tradeLoading, loadTrades } = useTradeStore(
    useShallow((state) => ({
      trades: state.trades,
      loading: state.loading,
      loadTrades: state.loadTrades,
    }))
  )
  const { assets, transactions, loading: walletLoading, loadWallet } = useWalletStore(
    useShallow((state) => ({
      assets: state.assets,
      transactions: state.transactions,
      loading: state.loading,
      loadWallet: state.loadWallet,
    }))
  )
  const {
    copyAllocations,
    investmentPositions,
    botSubscriptions,
    followingTraderIds,
    loading: platformLoading,
    loadCatalog,
  } = usePlatformStore(
    useShallow((state) => ({
      copyAllocations: state.copyAllocations,
      investmentPositions: state.investmentPositions,
      botSubscriptions: state.botSubscriptions,
      followingTraderIds: state.followingTraderIds,
      loading: state.loading,
      loadCatalog: state.loadCatalog,
    }))
  )
  const { overview, steps, loading: verificationLoading, loadVerification } = useVerificationStore(
    useShallow((state) => ({
      overview: state.overview,
      steps: state.steps,
      loading: state.loading,
      loadVerification: state.loadVerification,
    }))
  )

  useEffect(() => {
    void Promise.all([loadTrades(userId), loadWallet(true), loadCatalog(), loadVerification()])
  }, [loadCatalog, loadTrades, loadVerification, loadWallet, userId])

  const dashboardLoading = tradeLoading || walletLoading || platformLoading || verificationLoading
  const fiatAsset = assets.find((asset) => asset.assetType === 'fiat')
  const fiatBalanceUsd = useMemo(
    () => (fiatAsset ? fiatAsset.userBalance * Number(fiatAsset.price) : 0),
    [fiatAsset]
  )

  const walletAssets = useMemo(
    () =>
      assets
        .map((asset) => ({
          ...asset,
          usdValue: Number((asset.userBalance * Number(asset.price)).toFixed(2)),
        }))
        .sort((left, right) => right.usdValue - left.usdValue),
    [assets]
  )

  const walletValue = useMemo(
    () => walletAssets.reduce((sum, asset) => sum + asset.usdValue, 0),
    [walletAssets]
  )
  const copyCapital = useMemo(
    () => copyAllocations.reduce((sum, allocation) => sum + allocation.amount, 0),
    [copyAllocations]
  )
  const investmentCapital = useMemo(
    () => investmentPositions.reduce((sum, position) => sum + position.amount, 0),
    [investmentPositions]
  )
  const portfolioValue = walletValue + copyCapital + investmentCapital
  const liveTradeMargin = useMemo(
    () =>
      trades
        .filter((trade) => trade.status === 'open' || trade.status === 'pending')
        .reduce((sum, trade) => sum + trade.margin, 0),
    [trades]
  )
  const openTrades = useMemo(
    () => trades.filter((trade) => trade.status === 'open' || trade.status === 'pending'),
    [trades]
  )
  const realizedPnl = useMemo(
    () =>
      trades
        .filter((trade) => trade.roi !== 'pending')
        .reduce((sum, trade) => sum + Number(trade.roi), 0),
    [trades]
  )
  const completedTrades = useMemo(
    () => trades.filter((trade) => trade.status === 'completed'),
    [trades]
  )
  const winningTrades = completedTrades.filter((trade) => Number(trade.roi) > 0).length
  const winRate = completedTrades.length
    ? Math.round((winningTrades / completedTrades.length) * 100)
    : 0
  const deploymentValue = liveTradeMargin + copyCapital + investmentCapital
  const deploymentPct = portfolioValue > 0 ? Math.round((deploymentValue / portfolioValue) * 100) : 0
  const nowSec = Math.floor(new Date().getTime() / 1000)
  const activeBotSubscriptions = botSubscriptions.filter((sub) => isSubscriptionActive(sub.expiresAt, nowSec))
  const activeCopySubscriptions = copyAllocations.filter((alloc) =>
    isSubscriptionActive(alloc.expiresAt, nowSec)
  )
  const activePrograms =
    activeBotSubscriptions.length + activeCopySubscriptions.length + investmentPositions.length
  const topAssets = walletAssets.slice(0, 4)
  const activeStep = steps.find((step) => step.status === 'active') ?? null
  const latestTransactions = transactions.slice(0, 4)

  const allocationRows = useMemo(() => {
    const safePercentage = (value: number) =>
      portfolioValue > 0 ? Math.min(100, Math.max(0, Math.round((value / portfolioValue) * 100))) : 0

    return [
      {
        label: 'Cash funding',
        value: fiatAsset ? formatCurrency(fiatBalanceUsd, 'USD') : 'Unavailable',
        percentage: safePercentage(fiatBalanceUsd),
        accentClass: 'bg-sky-500/80',
      },
      {
        label: 'Live trade margin',
        value: formatCurrency(liveTradeMargin, 'USD'),
        percentage: safePercentage(liveTradeMargin),
        accentClass: 'bg-green-500/80',
      },
      {
        label: 'Copy trading allocations',
        value: formatCurrency(copyCapital, 'USD'),
        percentage: safePercentage(copyCapital),
        accentClass: 'bg-violet-500/80',
      },
      {
        label: 'Investment mandates',
        value: formatCurrency(investmentCapital, 'USD'),
        percentage: safePercentage(investmentCapital),
        accentClass: 'bg-amber-500/80',
      },
    ]
  }, [copyCapital, fiatAsset, fiatBalanceUsd, investmentCapital, liveTradeMargin, portfolioValue])

  const metrics = [
    {
      label: 'Portfolio Value',
      value: formatCurrency(portfolioValue, 'USD'),
      subtext: 'Wallet balances plus funded mandates',
    },
    {
      label: 'Fiat ready',
      value: fiatAsset ? formatCurrency(fiatBalanceUsd, 'USD') : 'Unavailable',
      subtext: 'Cash wallet as USD equivalent (for desk pricing and margin)',
    },
    {
      label: 'Live Setups',
      value: `${openTrades.length} positions`,
      subtext: `Win rate ${winRate}% across closed trades`,
    },
    {
      label: 'Realized PnL',
      value: `${realizedPnl >= 0 ? '+' : ''}${formatCurrency(realizedPnl, 'USD')}`,
      subtext: `${activePrograms} active programs and mandates`,
      accent: realizedPnl >= 0 ? 'text-green-300' : 'text-rose-300',
    },
  ]

  return (
    <div className="space-y-8 p-6">
      {show2faBanner && !twoFaEnabled && (
        <TwoFaBanner onDismiss={dismiss2faBanner} />
      )}

      <section className="gradient-background relative overflow-hidden rounded-3xl border border-neutral-800/80 p-6 md:p-7">
        <div className="pointer-events-none absolute -top-20 right-0 h-72 w-72 rounded-full bg-green-500/8 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-16 left-8 h-48 w-48 rounded-full bg-emerald-500/6 blur-3xl" />

        <div className="relative grid gap-6 xl:grid-cols-[minmax(0,1.2fr)_minmax(20rem,0.95fr)]">
          <div>
            <div className="flex flex-wrap items-center gap-3">
              <GradientBadge tone={badge.tone} size="xs">
                {badge.text}
              </GradientBadge>
              {user?.lastLog ? (
                <span className="text-xs text-neutral-500">
                  Last activity {formatDateWithTime(user.lastLog)}
                </span>
              ) : null}
            </div>

            <h1 className="mt-5 text-2xl font-bold tracking-tight text-neutral-100 md:text-4xl">
              Welcome back{user?.firstName ? `, ${user.firstName}` : ''}
            </h1>
            <p className="mt-3 max-w-2xl text-sm text-neutral-400 md:text-base">
              A professional command center for funding, trade execution, managed allocations, and account readiness.
            </p>

            <div className="mt-5 flex flex-wrap gap-3">
              <Link
                to="/live-trading"
                className="rounded-full bg-green-500/15 px-4 py-2 text-sm text-green-300 transition-colors hover:bg-green-500/25"
              >
                Open trading desk
              </Link>
              <Link
                to={paths.dashboardWallet}
                className="rounded-full border border-neutral-800 bg-neutral-950/70 px-4 py-2 text-sm text-neutral-300 transition-colors hover:text-green-400"
              >
                Review funding wallet
              </Link>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {metrics.map((metric) => (
              <DashboardMetric
                key={metric.label}
                label={metric.label}
                value={metric.value}
                subtext={metric.subtext}
                accent={metric.accent}
                loading={dashboardLoading}
              />
            ))}
          </div>
        </div>
      </section>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
        <ActionTile
          to={paths.dashboardHub}
          iconClass="fi fi-rr-apps"
          title="Trade Center"
          body="Access product desks, active mandates, and product-level controls."
        />
        <ActionTile
          to={paths.dashboardTrades}
          iconClass="fi fi-rr-time-past"
          title="Trade Archive"
          body="Inspect setup context, funding source, and realized performance."
        />
        <ActionTile
          to={paths.dashboardWallet}
          iconClass="fi fi-rr-wallet"
          title="Funding Wallet"
          body="Move capital between fiat and crypto balances before deployment."
        />
        <ActionTile
          to={paths.dashboardVerification}
          iconClass="fi fi-rr-shield-check"
          title="Account Readiness"
          body="Monitor compliance tier, funding limits, and review milestones."
        />
      </div>

      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-neutral-400">Markets</h2>
          <Link to="/live-trading" className="text-xs text-green-400 hover:text-green-300">
            Open market desk
          </Link>
        </div>
        <PairBanner setSymbol={setSymbol} />
      </section>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1.2fr)_24rem]">
        <section className="space-y-3">
     
          <MiniTradeHistory />
        </section>

        <div className="space-y-6">
          <GoalProgressCard
            goalPct={deploymentPct}
            label="Capital Deployment"
            description="Share of portfolio value currently assigned to open trades, copy-trading allocations, and managed investment mandates."
          />

          <section className="gradient-background rounded-2xl border border-neutral-800/80 p-5">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-neutral-200">Readiness Snapshot</h3>
                <p className="mt-1 text-xs text-neutral-500">Funding, compliance, and product posture.</p>
              </div>
              <GradientBadge tone={badge.tone} size="xs">
                {badge.text}
              </GradientBadge>
            </div>

            <div className="mt-5 grid grid-cols-2 gap-3">
              <DashboardMetric
                label="Automation"
                value={`${activeBotSubscriptions.length} active`}
                subtext="Bot plans running"
              />
              <DashboardMetric
                label="Copy Trading"
                value={`${followingTraderIds.length} followed`}
                subtext="Lead traders funded"
              />
            </div>

            <div className="mt-4 space-y-3 rounded-2xl border border-neutral-800 bg-neutral-950/60 p-4">
              <div className="flex items-center justify-between text-sm">
                <span className="text-neutral-400">Verification tier</span>
                <span className="font-medium text-neutral-100">{overview?.tier ?? 'Loading'}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-neutral-400">Daily limit</span>
                <span className="font-medium text-neutral-100">{overview?.dailyLimit ?? 'Loading'}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-neutral-400">Next review</span>
                <span className="font-medium text-neutral-100">{overview?.nextReview ?? 'Loading'}</span>
              </div>
              {activeStep ? (
                <div className="rounded-2xl border border-amber-500/20 bg-amber-500/10 p-3">
                  <div className="text-xs font-semibold uppercase tracking-[0.16em] text-amber-300">
                    Active Compliance Step
                  </div>
                  <div className="mt-2 text-sm text-amber-100">{activeStep.title}</div>
                  <div className="mt-1 text-xs text-amber-100/70">{activeStep.eta}</div>
                </div>
              ) : null}
            </div>
          </section>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(0,0.95fr)]">
        <section className="gradient-background rounded-2xl border border-neutral-800/80 p-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h3 className="text-sm font-semibold text-neutral-200">Portfolio Mix</h3>
              <p className="mt-1 text-xs text-neutral-500">
                Treasury posture across wallet balances and funded product sleeves.
              </p>
            </div>
            <span className="text-sm font-semibold text-neutral-100">
              {formatCurrency(portfolioValue, 'USD')}
            </span>
          </div>

          <div className="mt-5 space-y-4">
            {allocationRows.map((row) => (
              <AllocationRow
                key={row.label}
                label={row.label}
                value={row.value}
                percentage={row.percentage}
                accentClass={row.accentClass}
              />
            ))}
          </div>

          <div className="mt-6 space-y-3">
            {topAssets.map((asset) => (
              <div
                key={asset.walletId}
                className="flex items-center justify-between gap-3 rounded-2xl border border-neutral-800 bg-neutral-950/50 px-4 py-3"
              >
                <div className="flex items-center gap-3">
                  <AssetAvatar
                    symbol={asset.coinShort}
                    name={asset.coinName}
                    assetType={asset.assetType}
                    iconUrl={asset.iconUrl}
                    iconClass={asset.iconClass}
                    sizeClassName="h-9 w-9"
                  />
                  <div>
                    <div className="text-sm font-medium text-neutral-100">{asset.coinName}</div>
                    <div className="text-xs text-neutral-500">
                      {formatNumber(asset.userBalance, asset.assetType === 'fiat' ? 2 : 4)} {asset.coinShort}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-semibold text-neutral-100">
                    {formatCurrency(asset.usdValue, 'USD')}
                  </div>
                  <div className="text-xs text-neutral-500">{asset.change24hrs}% 24h</div>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="gradient-background rounded-2xl border border-neutral-800/80 p-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h3 className="text-sm font-semibold text-neutral-200">Operations Radar</h3>
              <p className="mt-1 text-xs text-neutral-500">
                Funding events, active exposure, and account throughput in one place.
              </p>
            </div>
            <GradientBadge tone="sky" size="xs">
              {formatLength(transactions.length)} ledger events
            </GradientBadge>
          </div>

          <div className="mt-5 grid grid-cols-2 gap-3">
            <DashboardMetric
              label="Open Margin"
              value={formatCurrency(liveTradeMargin, 'USD')}
              subtext={`${openTrades.length} active setups`}
            />
            <DashboardMetric
              label="Managed Capital"
              value={formatCurrency(copyCapital + investmentCapital, 'USD')}
              subtext="Copy and investment mandates"
            />
          </div>

          <div className="mt-4 space-y-3">
            {latestTransactions.map((transaction) => (
              <div
                key={transaction.id}
                className="rounded-2xl border border-neutral-800 bg-neutral-950/50 px-4 py-3"
              >
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-sm font-medium text-neutral-100">{transaction.method.name}</span>
                      <GradientBadge tone={transactionTone(transaction.type)} size="xs">
                        {transaction.type}
                      </GradientBadge>
                    </div>
                    <div className="mt-2 text-xs text-neutral-500">{transaction.note}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-semibold text-neutral-100">
                      {formatCurrency(transaction.eqAmount, 'USD')}
                    </div>
                    <div className="text-xs text-neutral-500">{formatDateWithTime(transaction.createdAt)}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  )
}
