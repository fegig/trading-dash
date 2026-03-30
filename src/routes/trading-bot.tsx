import { useEffect, useMemo } from 'react'
import { Link } from 'react-router'
import { toast } from 'react-toastify'
import { useShallow } from 'zustand/react/shallow'
import GradientBadge from '../components/common/GradientBadge'
import PageHero from '../components/common/PageHero'
import { keywordTone } from '../components/common/gradientBadgeTones'
import { usePlatformStore, useWalletStore } from '../stores'
import { formatCurrency } from '../util/formatCurrency'

function MetricCard({ label, value, accent }: { label: string; value: string; accent?: string }) {
  return (
    <div className="rounded-2xl border border-neutral-800 bg-neutral-950/60 p-4">
      <div className="text-[11px] uppercase tracking-[0.16em] text-neutral-500">{label}</div>
      <div className={`mt-2 text-sm font-semibold ${accent ?? 'text-neutral-100'}`}>{value}</div>
    </div>
  )
}

export default function TradingBotPage() {
  const { bots, ownedBotIds, selectedBotId, loadCatalog, selectBot, purchaseBot } = usePlatformStore(
    useShallow((state) => ({
      bots: state.bots,
      ownedBotIds: state.ownedBotIds,
      selectedBotId: state.selectedBotId,
      loadCatalog: state.loadCatalog,
      selectBot: state.selectBot,
      purchaseBot: state.purchaseBot,
    }))
  )
  const { assets, loadWallet } = useWalletStore(
    useShallow((state) => ({
      assets: state.assets,
      loadWallet: state.loadWallet,
    }))
  )

  useEffect(() => {
    void Promise.all([loadCatalog(), loadWallet()])
  }, [loadCatalog, loadWallet])

  const fiatAsset = assets.find((asset) => asset.assetType === 'fiat')
  const selectedBot = bots.find((bot) => bot.id === selectedBotId) ?? bots[0]
  const averageWinRate = useMemo(() => {
    if (!bots.length) return 0
    return Math.round(bots.reduce((sum, bot) => sum + bot.winRate, 0) / bots.length)
  }, [bots])

  const handlePurchase = () => {
    if (!selectedBot) return
    const result = purchaseBot(selectedBot.id)
    if (result.ok) {
      toast.success(result.message)
    } else {
      toast.error(result.message)
    }
  }

  return (
    <div className="space-y-6">
      <PageHero
        backTo="/trade-center"
        backLabel="Back to Trade Center"
        eyebrow="Automation Desk"
        title="Systematic trading plans with controlled activation"
        description="Bot plans are now loaded from the service layer, purchased from the fiat wallet, and retained in the shared store so automation activation behaves like a production product workflow."
        iconClass="fi fi-rs-robot"
        stats={[
          { label: 'Active Bots', value: `${ownedBotIds.length} running` },
          {
            label: 'Cash Available',
            value: fiatAsset ? formatCurrency(fiatAsset.userBalance, 'USD') : 'Unavailable',
          },
          { label: 'Average Win Rate', value: `${averageWinRate}%` },
        ]}
        actions={
          <>
            <Link
              to="/wallet"
              className="rounded-full bg-green-500/15 px-4 py-2 text-sm text-green-300 hover:bg-green-500/25 transition-colors"
            >
              Top up cash wallet
            </Link>
            <Link
              to="/trades"
              className="rounded-full border border-neutral-800 bg-neutral-950/70 px-4 py-2 text-sm text-neutral-300 hover:text-green-400 transition-colors"
            >
              Review trade archive
            </Link>
          </>
        }
      />

      <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_24rem] gap-6">
        <div className="space-y-4">
          {bots.map((bot) => {
            const isActive = ownedBotIds.includes(bot.id)
            return (
              <button
                key={bot.id}
                type="button"
                onClick={() => selectBot(bot.id)}
                className={`w-full text-left gradient-background rounded-2xl border p-5 transition-all ${
                  selectedBot?.id === bot.id
                    ? 'border-green-500/30'
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
                      ) : null}
                    </div>
                    <p className="text-sm text-neutral-500 mt-2">{bot.strapline}</p>
                    <p className="text-sm text-neutral-400 mt-3">{bot.description}</p>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 lg:min-w-[22rem]">
                    <MetricCard label="Price" value={formatCurrency(bot.priceUsd, 'USD')} />
                    <MetricCard label="Target" value={bot.monthlyTarget} accent="text-green-300" />
                    <MetricCard label="Win Rate" value={`${bot.winRate}%`} />
                    <MetricCard label="Drawdown" value={`${bot.maxDrawdown}%`} accent="text-amber-300" />
                  </div>
                </div>
              </button>
            )
          })}
        </div>

        <aside className="gradient-background rounded-2xl border border-neutral-800/80 p-5 space-y-5 sticky top-6 h-fit">
          {selectedBot ? (
            <>
              <div>
                <div className="text-xs uppercase tracking-[0.16em] text-neutral-500">Selected Plan</div>
                <h2 className="text-2xl font-semibold text-neutral-100 mt-2">{selectedBot.name}</h2>
                <p className="text-sm text-neutral-400 mt-3">{selectedBot.description}</p>
                <div className="mt-4 flex flex-wrap gap-2">
                  <GradientBadge tone={keywordTone(selectedBot.strategy)} size="xs">
                    {selectedBot.strategy}
                  </GradientBadge>
                  <GradientBadge tone="green" size="xs">
                    {selectedBot.monthlyTarget} target
                  </GradientBadge>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <MetricCard label="Markets" value={selectedBot.markets.join(', ')} />
                <MetricCard label="Cadence" value={selectedBot.cadence} />
                <MetricCard label="Price" value={formatCurrency(selectedBot.priceUsd, 'USD')} />
                <MetricCard
                  label="Status"
                  value={ownedBotIds.includes(selectedBot.id) ? 'Already active' : 'Ready to deploy'}
                  accent={ownedBotIds.includes(selectedBot.id) ? 'text-sky-300' : 'text-green-300'}
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

              <button
                type="button"
                onClick={handlePurchase}
                className="w-full rounded-full bg-green-500/15 hover:bg-green-500/25 px-4 py-3 text-sm font-medium text-green-300"
              >
                {ownedBotIds.includes(selectedBot.id)
                  ? `${selectedBot.name} already active`
                  : `Purchase for ${formatCurrency(selectedBot.priceUsd, 'USD')}`}
              </button>
            </>
          ) : (
            <div className="text-sm text-neutral-500">Select a bot package to inspect its controls.</div>
          )}
        </aside>
      </div>
    </div>
  )
}
