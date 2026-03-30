import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router'
import { toast } from 'react-toastify'
import { useShallow } from 'zustand/react/shallow'
import GradientBadge from '../components/common/GradientBadge'
import PageHero from '../components/common/PageHero'
import { capacityTone, keywordTone } from '../components/common/gradientBadgeTones'
import { usePlatformStore, useWalletStore } from '../stores'
import type { CopyTraderProfile } from '../types/platform'
import { formatCurrency } from '../util/formatCurrency'
import { isSubscriptionActive } from '../util/subscription'

function MetricCard({ label, value, accent }: { label: string; value: string; accent?: string }) {
  return (
    <div className="rounded-2xl border border-neutral-800 bg-neutral-950/60 p-4">
      <div className="text-[11px] uppercase tracking-[0.16em] text-neutral-500">{label}</div>
      <div className={`mt-2 text-sm font-semibold ${accent ?? 'text-neutral-100'}`}>{value}</div>
    </div>
  )
}

function formatSubDate(ts: number) {
  return new Date(ts * 1000).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

export default function CopyTradingPage() {
  const {
    copyTraders,
    copyAllocations,
    followingTraderIds,
    selectedTraderId,
    loadCatalog,
    selectTrader,
    followTrader,
  } = usePlatformStore(
    useShallow((state) => ({
      copyTraders: state.copyTraders,
      copyAllocations: state.copyAllocations,
      followingTraderIds: state.followingTraderIds,
      selectedTraderId: state.selectedTraderId,
      loadCatalog: state.loadCatalog,
      selectTrader: state.selectTrader,
      followTrader: state.followTrader,
    }))
  )
  const { assets, loadWallet } = useWalletStore(
    useShallow((state) => ({
      assets: state.assets,
      loadWallet: state.loadWallet,
    }))
  )

  const [allocation, setAllocation] = useState('')
  const nowSec = Math.floor(new Date().getTime() / 1000)

  useEffect(() => {
    void Promise.all([loadCatalog(), loadWallet()])
  }, [loadCatalog, loadWallet])

  const selectedTrader = copyTraders.find((trader) => trader.id === selectedTraderId) ?? copyTraders[0]
  const fiatAsset = assets.find((asset) => asset.assetType === 'fiat')
  const averageReturn = useMemo(() => {
    if (!copyTraders.length) return '0%'
    const values = copyTraders.map((trader) =>
      Number(trader.monthlyReturn.replace('%', '').replace('+', ''))
    )
    const avg = values.reduce((sum, value) => sum + value, 0) / values.length
    return `+${avg.toFixed(1)}%`
  }, [copyTraders])
  const allocatedCapital = useMemo(
    () => copyAllocations.reduce((sum, item) => sum + item.amount, 0),
    [copyAllocations]
  )

  const selectedAlloc = copyAllocations.find((item) => item.traderId === selectedTrader?.id)
  const currentAllocation = selectedAlloc?.amount ?? 0
  const subActive = selectedAlloc ? isSubscriptionActive(selectedAlloc.expiresAt, nowSec) : false

  const handleAllocate = () => {
    if (!selectedTrader) return
    const result = followTrader(selectedTrader.id, Number(allocation || selectedTrader.minAllocation))
    if (result.ok) {
      toast.success(result.message)
    } else {
      toast.error(result.message)
    }
  }

  const pickTrader = (trader: CopyTraderProfile) => {
    selectTrader(trader.id)
    setAllocation(String(trader.minAllocation))
  }

  const traderRows = copyTraders.map((trader) => {
    const following = followingTraderIds.includes(trader.id)
    const alloc = copyAllocations.find((item) => item.traderId === trader.id)
    const traderAllocation = alloc?.amount ?? 0
    const subLive = alloc ? isSubscriptionActive(alloc.expiresAt, nowSec) : false
    return {
      trader,
      following,
      alloc,
      traderAllocation,
      subLive,
    }
  })

  return (
    <div className="space-y-6">
      <PageHero
        backTo="/trade-center"
        backLabel="Back to Trade Center"
        title="Allocate capital to lead traders with controlled funding"
        description="Copy-trading participation now flows through the shared store with tracked allocations, wallet debits, and persistent trader funding state so the desk behaves like a real managed product."
        stats={[
          { label: 'Following', value: `${followingTraderIds.length} traders` },
          { label: 'Allocated Capital', value: formatCurrency(allocatedCapital, 'USD') },
          {
            label: 'Cash Available',
            value: fiatAsset ? formatCurrency(fiatAsset.userBalance, 'USD') : 'Unavailable',
          },
          { label: 'Average Return', value: averageReturn },
        ]}
        actions={
          <>
            <Link
              to="/wallet"
              className="rounded-full bg-green-500/15 px-4 py-2 text-sm text-green-300 hover:bg-green-500/25 transition-colors"
            >
              Fund allocations
            </Link>
            <Link
              to="/dashboard"
              className="rounded-full border border-neutral-800 bg-neutral-950/70 px-4 py-2 text-sm text-neutral-300 hover:text-green-400 transition-colors"
            >
              Return to command center
            </Link>
          </>
        }
      />

      <div className="grid grid-cols-1 items-start xl:grid-cols-[minmax(0,1fr)_24rem] gap-6">
        <div className="space-y-4">
          <div className="xl:hidden space-y-4">
            {traderRows.map(({ trader, following, alloc, traderAllocation, subLive }) => (
              <button
                key={trader.id}
                type="button"
                onClick={() => pickTrader(trader)}
                className={`w-full text-left gradient-background rounded-2xl border p-5 transition-all ${
                  selectedTrader?.id === trader.id
                    ? 'border-green-500/30'
                    : 'border-neutral-800/80 hover:border-neutral-700'
                }`}
              >
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div className="max-w-3xl">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-lg font-semibold text-neutral-100">{trader.name}</span>
                      <span className="text-xs text-neutral-500">{trader.handle}</span>
                      <GradientBadge tone={capacityTone(trader.capacity)} size="xs">
                        {trader.capacity}
                      </GradientBadge>
                      {following ? (
                        <GradientBadge tone="sky" size="xs">
                          Following
                        </GradientBadge>
                      ) : null}
                    </div>
                    <p className="mt-2 text-sm text-neutral-500">{trader.specialty}</p>
                    <p className="mt-3 text-sm text-neutral-400">{trader.bio}</p>
                    {alloc ? (
                      <div className="mt-3 flex flex-wrap gap-2 text-xs text-neutral-500">
                        <span>
                          P&amp;L:{' '}
                          <span className="text-green-300 font-medium">
                            +{formatCurrency(alloc.lifetimePnlUsd, 'USD')}
                          </span>
                        </span>
                        <span className="text-neutral-600">·</span>
                        <span>
                          Sub {subLive ? 'ends' : 'ended'}{' '}
                          <span className="text-neutral-300">{formatSubDate(alloc.expiresAt)}</span>
                        </span>
                      </div>
                    ) : null}
                  </div>

                  <div className="grid grid-cols-2 gap-3 lg:min-w-[22rem] lg:grid-cols-4">
                    <MetricCard label="Monthly" value={trader.monthlyReturn} accent="text-green-300" />
                    <MetricCard label="Win Rate" value={`${trader.winRate}%`} />
                    <MetricCard label="Drawdown" value={`${trader.maxDrawdown}%`} accent="text-amber-300" />
                    <MetricCard
                      label="Your Allocation"
                      value={traderAllocation ? formatCurrency(traderAllocation, 'USD') : 'Not funded'}
                      accent={traderAllocation ? 'text-sky-300' : undefined}
                    />
                  </div>
                </div>
              </button>
            ))}
          </div>

          <div className="hidden xl:block overflow-x-auto scrollbar-none rounded-2xl border border-neutral-800/80 gradient-background">
            <table className="w-full min-w-[920px] text-sm border-separate border-spacing-0">
              <thead>
                <tr className="text-left text-xs text-neutral-500 border-b border-neutral-800">
                  <th className="px-4 py-3 font-medium">Trader</th>
                  <th className="px-3 py-3 font-medium">Capacity</th>
                  <th className="px-3 py-3 font-medium">Monthly</th>
                  <th className="px-3 py-3 font-medium">Win</th>
                  <th className="px-3 py-3 font-medium">DD</th>
                  <th className="px-3 py-3 font-medium">Allocation</th>
                  <th className="px-3 py-3 font-medium">P&amp;L</th>
                  <th className="px-3 py-3 font-medium">Sub ends</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {traderRows.map(({ trader, following, alloc, traderAllocation, subLive }) => (
                  <tr
                    key={trader.id}
                    role="button"
                    tabIndex={0}
                    onClick={() => pickTrader(trader)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault()
                        pickTrader(trader)
                      }
                    }}
                    className={`cursor-pointer border-b border-neutral-800/60 transition-colors hover:bg-neutral-800/25 ${
                      selectedTrader?.id === trader.id ? 'bg-green-500/5' : ''
                    }`}
                  >
                    <td className="px-4 py-3 align-top">
                      <div className="font-semibold text-neutral-100">{trader.name}</div>
                      <div className="text-xs text-neutral-500">{trader.handle}</div>
                    </td>
                    <td className="px-3 py-3 align-top">
                      <GradientBadge tone={capacityTone(trader.capacity)} size="xs">
                        {trader.capacity}
                      </GradientBadge>
                    </td>
                    <td className="px-3 py-3 text-green-300 align-top">{trader.monthlyReturn}</td>
                    <td className="px-3 py-3 align-top">{trader.winRate}%</td>
                    <td className="px-3 py-3 text-amber-300/90 align-top">{trader.maxDrawdown}%</td>
                    <td className="px-3 py-3 align-top text-sky-300">
                      {traderAllocation ? formatCurrency(traderAllocation, 'USD') : '—'}
                    </td>
                    <td className="px-3 py-3 align-top">
                      {alloc ? (
                        <span className="text-green-300">+{formatCurrency(alloc.lifetimePnlUsd, 'USD')}</span>
                      ) : (
                        '—'
                      )}
                    </td>
                    <td className="px-3 py-3 text-neutral-400 text-xs align-top">
                      {alloc ? formatSubDate(alloc.expiresAt) : '—'}
                    </td>
                    <td className="px-4 py-3 align-top">
                      {following ? (
                        <GradientBadge tone={subLive ? 'sky' : 'neutral'} size="xs">
                          {subLive ? 'Active sub' : 'Expired'}
                        </GradientBadge>
                      ) : (
                        <span className="text-xs text-neutral-500">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <aside className="gradient-background rounded-2xl border border-neutral-800/80 p-5 space-y-5 sticky  h-fit self-start">
          {selectedTrader ? (
            <>
              <div>
                <div className="text-xs uppercase tracking-[0.16em] text-neutral-500">Lead Trader</div>
                <h2 className="text-2xl font-semibold text-neutral-100 mt-2">{selectedTrader.name}</h2>
                <p className="text-sm text-neutral-400 mt-3">{selectedTrader.bio}</p>
                <div className="mt-4 flex flex-wrap gap-2">
                  <GradientBadge tone={capacityTone(selectedTrader.capacity)} size="xs">
                    {selectedTrader.capacity}
                  </GradientBadge>
                  <GradientBadge tone="green" size="xs">
                    {selectedTrader.monthlyReturn} monthly
                  </GradientBadge>
                </div>
              </div>

              {selectedAlloc ? (
                <div className="rounded-2xl border border-neutral-800 bg-neutral-950/60 p-4 space-y-2">
                  <div className="text-[11px] uppercase tracking-[0.16em] text-neutral-500">Copy subscription</div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-neutral-500">P&amp;L to date</span>
                    <span className="font-semibold text-green-300">
                      +{formatCurrency(selectedAlloc.lifetimePnlUsd, 'USD')}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-neutral-500">{subActive ? 'Renews / ends' : 'Ended'}</span>
                    <span className="text-neutral-200">{formatSubDate(selectedAlloc.expiresAt)}</span>
                  </div>
                  <GradientBadge tone={subActive ? 'sky' : 'neutral'} size="xs">
                    {subActive ? 'Subscription active' : 'Subscription ended'}
                  </GradientBadge>
                </div>
              ) : null}

              <div className="grid grid-cols-2 gap-3">
                <MetricCard label="Win Rate" value={`${selectedTrader.winRate}%`} />
                <MetricCard label="Followers" value={String(selectedTrader.followers)} />
                <MetricCard label="Fee" value={`${selectedTrader.feePct}%`} />
                <MetricCard
                  label="Your Allocation"
                  value={currentAllocation ? formatCurrency(currentAllocation, 'USD') : 'Not funded'}
                  accent={currentAllocation ? 'text-sky-300' : undefined}
                />
              </div>

              <div className="rounded-2xl border border-neutral-800 bg-neutral-950/60 p-4">
                <div className="text-[11px] uppercase tracking-[0.16em] text-neutral-500">Focus Pairs</div>
                <div className="mt-3 flex flex-wrap gap-2">
                  {selectedTrader.focusPairs.map((pair) => (
                    <GradientBadge key={pair} tone={keywordTone(pair)} size="xs">
                      {pair}
                    </GradientBadge>
                  ))}
                </div>
              </div>

              <div className="rounded-2xl border border-neutral-800 bg-neutral-950/60 p-4 space-y-3">
                <div className="text-[11px] uppercase tracking-[0.16em] text-neutral-500">Allocation</div>
                <input
                  type="text"
                  value={allocation || String(selectedTrader.minAllocation)}
                  onChange={(event) => {
                    const value = event.target.value
                    if (/^\d*\.?\d*$/.test(value)) setAllocation(value)
                  }}
                  className="w-full rounded-xl border border-neutral-800 bg-neutral-900/80 px-4 py-3 text-sm text-neutral-100 outline-none focus:border-green-500/30"
                />
                <div className="flex items-center justify-between text-xs text-neutral-500">
                  <span>Minimum allocation</span>
                  <span>{formatCurrency(selectedTrader.minAllocation, 'USD')}</span>
                </div>
                <div className="flex items-center justify-between text-xs text-neutral-500">
                  <span>Performance fee</span>
                  <span>{selectedTrader.feePct}%</span>
                </div>
                <div className="flex items-center justify-between text-xs text-neutral-500">
                  <span>Cash funding available</span>
                  <span>{fiatAsset ? formatCurrency(fiatAsset.userBalance, 'USD') : 'Unavailable'}</span>
                </div>
              </div>

              <div className="rounded-2xl border border-green-500/20 bg-green-500/10 p-4">
                <div className="text-sm font-semibold text-green-300">Funding Flow</div>
                <p className="text-xs text-green-100/80 mt-2">
                  Each new allocation draws from the fiat wallet first, then updates your tracked exposure inside the platform store.
                </p>
              </div>

              <button
                type="button"
                onClick={handleAllocate}
                className="w-full rounded-full bg-green-500/15 hover:bg-green-500/25 px-4 py-3 text-sm font-medium text-green-300"
              >
                Allocate from cash wallet
              </button>
            </>
          ) : (
            <div className="text-sm text-neutral-500">Select a lead trader to review allocation details.</div>
          )}
        </aside>
      </div>
    </div>
  )
}
