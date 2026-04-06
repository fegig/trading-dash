import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router'
import { toast } from 'react-toastify'
import { useShallow } from 'zustand/react/shallow'
import GradientBadge from '@/components/common/GradientBadge'
import Modal from '@/components/common/Modal'
import PageHero from '@/components/common/PageHero'
import { keywordTone } from '@/components/common/gradientBadgeTones'
import { usePlatformStore, useWalletStore } from '@/stores'
import { formatCurrency } from '@/util/formatCurrency'
import { formatUsdAndAccountFiat, safeFormatCurrency } from '@/util/walletDisplay'
import { isSubscriptionActive } from '@/util/subscription'
import { paths } from '@/navigation/paths'

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

export default function TradingBotPage() {
  const { bots, botSubscriptions, selectedBotId, loadCatalog, selectBot, purchaseBot } = usePlatformStore(
    useShallow((state) => ({
      bots: state.bots,
      botSubscriptions: state.botSubscriptions,
      selectedBotId: state.selectedBotId,
      loadCatalog: state.loadCatalog,
      selectBot: state.selectBot,
      purchaseBot: state.purchaseBot,
    }))
  )
  const { assets, loadWallet, displayCurrency } = useWalletStore(
    useShallow((state) => ({
      assets: state.assets,
      loadWallet: state.loadWallet,
      displayCurrency: state.displayCurrency,
    }))
  )

  const [detailModalOpen, setDetailModalOpen] = useState(false)

  useEffect(() => {
    void Promise.all([loadCatalog(), loadWallet()])
  }, [loadCatalog, loadWallet])

  const nowSec = Math.floor(new Date().getTime() / 1000)
  const fiatAsset = assets.find((asset) => asset.assetType === 'fiat')
  const selectedBot = bots.find((bot) => bot.id === selectedBotId) ?? bots[0]
  const averageWinRate = useMemo(() => {
    if (!bots.length) return 0
    return Math.round(bots.reduce((sum, bot) => sum + bot.winRate, 0) / bots.length)
  }, [bots])

  const activeSubscriptions = useMemo(
    () => botSubscriptions.filter((sub) => isSubscriptionActive(sub.expiresAt, nowSec)),
    [botSubscriptions, nowSec]
  )
  const expiredSubscriptions = useMemo(
    () => botSubscriptions.filter((sub) => !isSubscriptionActive(sub.expiresAt, nowSec)),
    [botSubscriptions, nowSec]
  )

  const subscriptionForSelected = selectedBot
    ? botSubscriptions.filter((sub) => sub.botId === selectedBot.id).sort((a, b) => b.expiresAt - a.expiresAt)[0]
    : undefined
  const selectedSubActive = subscriptionForSelected
    ? isSubscriptionActive(subscriptionForSelected.expiresAt, nowSec)
    : false

  const handlePurchase = () => {
    if (!selectedBot) return
    void (async () => {
      const result = await purchaseBot(selectedBot.id)
      if (result.ok) {
        toast.success(result.message)
      } else {
        toast.error(result.message)
      }
    })()
  }

  const isBotActive = (botId: string) =>
    botSubscriptions.some((sub) => sub.botId === botId && isSubscriptionActive(sub.expiresAt, nowSec))

  const anyActiveSubscription = botSubscriptions.find((sub) => isSubscriptionActive(sub.expiresAt, nowSec))
  const anyOtherActive = anyActiveSubscription && anyActiveSubscription.botId !== selectedBot?.id

  return (
    <div className="space-y-6">
      <PageHero
        backTo={paths.dashboardHub}
        backLabel="Back to Trade Center"
        title="Trading plans with controlled activation"
        description="Bot plans are now loaded from the service layer, purchased from the fiat wallet, and retained in the shared store so automation activation behaves like a production product workflow."
        stats={[
          { label: 'Active Bots', value: `${activeSubscriptions.length} running` },
          {
            label: 'Cash Available',
            value: fiatAsset
              ? `${safeFormatCurrency(fiatAsset.userBalance, displayCurrency.code)} (~${formatCurrency(
                  fiatAsset.userBalance * displayCurrency.usdPerUnit,
                  'USD'
                )})`
              : 'Unavailable',
          },
          { label: 'Average Win Rate', value: `${averageWinRate}%` },
        ]}
        actions={
          <>
            <Link
              to={paths.dashboardWallet}
              className="rounded-full bg-green-500/15 px-4 py-2 text-sm text-green-300 hover:bg-green-500/25 transition-colors"
            >
              Top up cash wallet
            </Link>
            <Link
              to={paths.dashboardTrades}
              className="rounded-full border border-neutral-800 bg-neutral-950/70 px-4 py-2 text-sm text-neutral-300 hover:text-green-400 transition-colors"
            >
              Review trade archive
            </Link>
          </>
        }
      />

      {botSubscriptions.length > 0 ? (
        <section className="gradient-background rounded-2xl border border-neutral-800/80 p-5 space-y-4">
          <div>
            <div className="text-xs uppercase tracking-[0.16em] text-neutral-500">Subscriptions</div>
            <h2 className="text-lg font-semibold text-neutral-100 mt-1">Active bot subscriptions</h2>
            <p className="text-xs text-neutral-500 mt-1">Profit to date and renewal dates for running automations.</p>
          </div>

          {activeSubscriptions.length > 0 ? (
            <div className="space-y-3">
              {activeSubscriptions.map((sub) => {
                const bot = bots.find((b) => b.id === sub.botId)
                if (!bot) return null
                return (
                  <div
                    key={`${sub.botId}-${sub.subscribedAt}`}
                    className="rounded-2xl border border-green-500/20 bg-green-500/5 p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3"
                  >
                    <div>
                      <div className="font-semibold text-neutral-100">{bot.name}</div>
                      <div className="text-xs text-neutral-500 mt-1">{bot.strategy}</div>
                    </div>
                    <div className="flex flex-wrap gap-4 text-sm">
                      <div>
                        <div className="text-[10px] uppercase tracking-wider text-neutral-500">Profit</div>
                        <div className="text-green-300 font-semibold">
                          +{formatCurrency(sub.lifetimePnlUsd, 'USD')}
                        </div>
                      </div>
                      <div>
                        <div className="text-[10px] uppercase tracking-wider text-neutral-500">Expires</div>
                        <div className="text-neutral-200">{formatSubDate(sub.expiresAt)}</div>
                      </div>
                      <GradientBadge tone="sky" size="xs">
                        Active
                      </GradientBadge>
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <p className="text-sm text-neutral-500">No active subscriptions. Purchase a plan below to deploy.</p>
          )}

          {expiredSubscriptions.length > 0 ? (
            <div className="pt-2 border-t border-neutral-800/80">
              <div className="text-xs text-neutral-500 mb-2">Expired</div>
              <ul className="space-y-2">
                {expiredSubscriptions.map((sub) => {
                  const bot = bots.find((b) => b.id === sub.botId)
                  return (
                    <li
                      key={`exp-${sub.botId}-${sub.subscribedAt}`}
                      className="flex flex-wrap justify-between gap-2 text-xs text-neutral-500"
                    >
                      <span>{bot?.name ?? sub.botId}</span>
                      <span>
                        Ended {formatSubDate(sub.expiresAt)} · P&amp;L +{formatCurrency(sub.lifetimePnlUsd, 'USD')}
                      </span>
                    </li>
                  )
                })}
              </ul>
            </div>
          ) : null}
        </section>
      ) : null}

      <div className="space-y-4">
          {bots.map((bot) => {
            const isActive = isBotActive(bot.id)
            const blockedByOther =
              !isActive && !!anyActiveSubscription
            return (
              <button
                key={bot.id}
                type="button"
                onClick={() => {
                  selectBot(bot.id)
                  setDetailModalOpen(true)
                }}
                className={`w-full text-left gradient-background rounded-2xl border p-5 transition-all ${
                  selectedBot?.id === bot.id
                    ? 'border-green-500/30'
                    : blockedByOther
                      ? 'border-neutral-800/50 opacity-60'
                      : 'border-neutral-800/80 hover:border-neutral-700'
                }`}
              >
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div className="max-w-3xl">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-lg font-semibold text-neutral-100">{bot.name}</span>
                      <GradientBadge tone={keywordTone(bot.strategy)} size="xs">
                        {bot.strategy}
                      </GradientBadge>
                      {isActive ? (
                        <GradientBadge tone="sky" size="xs">
                          Active
                        </GradientBadge>
                      ) : blockedByOther ? (
                        <GradientBadge tone="neutral" size="xs">
                          Unavailable
                        </GradientBadge>
                      ) : null}
                    </div>
                    <p className="text-sm text-neutral-500 mt-2">{bot.strapline}</p>
                    <p className="text-sm text-neutral-400 mt-3">{bot.description}</p>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 lg:min-w-88">
                    <MetricCard
                      label="Price"
                      value={`${formatUsdAndAccountFiat(bot.priceUsd, displayCurrency).usd} · ${formatUsdAndAccountFiat(bot.priceUsd, displayCurrency).fiat}`}
                    />
                    <MetricCard label="Target" value={bot.monthlyTarget} accent="text-green-300" />
                    <MetricCard label="Win Rate" value={`${bot.winRate}%`} />
                    <MetricCard label="Drawdown" value={`${bot.maxDrawdown}%`} accent="text-amber-300" />
                  </div>
                </div>
              </button>
            )
          })}
      </div>

      <Modal
        isOpen={detailModalOpen && !!selectedBot}
        onClose={() => setDetailModalOpen(false)}
        title={selectedBot?.name ?? 'Plan details'}
        className="!max-w-2xl w-[min(96vw,36rem)] max-h-[min(90vh,44rem)]"
      >
        {selectedBot ? (
          <div className="space-y-5">
            <div>
              <div className="text-xs uppercase tracking-[0.16em] text-neutral-500">Selected Plan</div>
              <p className="text-sm text-neutral-400 mt-2">{selectedBot.description}</p>
              <div className="mt-4 flex flex-wrap gap-2">
                <GradientBadge tone={keywordTone(selectedBot.strategy)} size="xs">
                  {selectedBot.strategy}
                </GradientBadge>
                <GradientBadge tone="green" size="xs">
                  {selectedBot.monthlyTarget} target
                </GradientBadge>
              </div>
            </div>

            {subscriptionForSelected ? (
              <div className="rounded-2xl border border-neutral-800 bg-neutral-950/60 p-4 space-y-2">
                <div className="text-[11px] uppercase tracking-[0.16em] text-neutral-500">Subscription</div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-neutral-500">Profit to date</span>
                  <span className="font-semibold text-green-300">
                    +{formatCurrency(subscriptionForSelected.lifetimePnlUsd, 'USD')}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-neutral-500">{selectedSubActive ? 'Expires' : 'Ended'}</span>
                  <span className="text-neutral-200">{formatSubDate(subscriptionForSelected.expiresAt)}</span>
                </div>
                <GradientBadge tone={selectedSubActive ? 'sky' : 'neutral'} size="xs">
                  {selectedSubActive ? 'Active subscription' : 'Expired — renew to continue'}
                </GradientBadge>
              </div>
            ) : null}

            <div className="grid grid-cols-2 gap-3">
              <MetricCard label="Markets" value={selectedBot.markets.join(', ')} />
              <MetricCard label="Cadence" value={selectedBot.cadence} />
              <MetricCard
                label="Price"
                value={`${formatUsdAndAccountFiat(selectedBot.priceUsd, displayCurrency).usd} · ${formatUsdAndAccountFiat(selectedBot.priceUsd, displayCurrency).fiat}`}
              />
              <MetricCard
                label="Status"
                value={
                  selectedSubActive
                    ? 'Subscribed'
                    : subscriptionForSelected
                      ? 'Subscription ended'
                      : 'Ready to deploy'
                }
                accent={selectedSubActive ? 'text-sky-300' : 'text-green-300'}
              />
            </div>

            <div className="rounded-2xl border border-neutral-800 bg-neutral-950/60 p-4">
              <div className="text-[11px] uppercase tracking-[0.16em] text-neutral-500">Risk Guardrails</div>
              <div className="mt-3 flex flex-wrap gap-2">
                {selectedBot.guardrails.map((guardrail) => (
                  <GradientBadge key={guardrail} tone={keywordTone(guardrail)} size="xs">
                    {guardrail}
                  </GradientBadge>
                ))}
              </div>
            </div>

            <div className="rounded-2xl border border-green-500/20 bg-green-500/10 p-4">
              <div className="text-sm font-semibold text-green-300">Funding Source</div>
              <p className="text-xs text-green-100/80 mt-2">
                Bot activations debit from the fiat wallet and remain tracked in the platform store for downstream state and permissions.
              </p>
            </div>

            {anyOtherActive ? (
              <div className="rounded-2xl border border-amber-500/20 bg-amber-500/10 p-4">
                <div className="text-xs font-semibold text-amber-300">One bot at a time</div>
                <p className="text-xs text-amber-100/70 mt-1">
                  {bots.find((b) => b.id === anyActiveSubscription?.botId)?.name ?? 'Another bot'} is currently
                  running. It must expire or be cancelled before activating a new plan.
                </p>
              </div>
            ) : null}

            <button
              type="button"
              onClick={handlePurchase}
              disabled={selectedSubActive || !!anyOtherActive}
              className="w-full rounded-full bg-green-500/15 hover:bg-green-500/25 px-4 py-3 text-sm font-medium text-green-300 disabled:opacity-50 disabled:pointer-events-none"
            >
              {selectedSubActive
                ? `${selectedBot.name} subscription active`
                : anyOtherActive
                  ? 'Another bot is already running'
                  : `Purchase for ${formatUsdAndAccountFiat(selectedBot.priceUsd, displayCurrency).usd} (${formatUsdAndAccountFiat(selectedBot.priceUsd, displayCurrency).fiat})`}
            </button>
          </div>
        ) : null}
      </Modal>
    </div>
  )
}
