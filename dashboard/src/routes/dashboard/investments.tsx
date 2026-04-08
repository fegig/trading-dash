import { useEffect, useMemo, useState } from 'react'
import { toast } from 'react-toastify'
import { useShallow } from 'zustand/react/shallow'
import GradientBadge from '@/components/common/GradientBadge'
import {
  investmentCategoryTone,
  keywordTone,
  riskTone,
} from '@/components/common/gradientBadgeTones'
import Modal from '@/components/common/Modal'
import PageHero from '@/components/common/PageHero'
import { usePlatformStore, useWalletStore } from '@/stores'
import type { InvestmentCategory } from '@/types/platform'
import { formatCurrency } from '@/util/formatCurrency'
import { formatUsdAndAccountFiat, safeFormatCurrency } from '@/util/walletDisplay'
import { estimatePositionRoi } from '@/util/investmentRoi'

const investmentCategories: Array<'All' | InvestmentCategory> = [
  'All',
  'Short Term',
  'Long Term',
  'Retirement',
]

function formatTerm(termDays: number) {
  if (termDays >= 365) return `${Math.round(termDays / 30)} months`
  if (termDays >= 90) return `${Math.round(termDays / 30)} months`
  return `${termDays} days`
}

function MetricPanel({ label, value, accent }: { label: string; value: string; accent?: string }) {
  return (
    <div className="">
      <div className="text-[8px]  tracking-[0.16em] text-neutral-500">{label}</div>
      <div className={`mt-2 text-xs font-semibold ${accent ?? 'text-neutral-100'}`}>{value}</div>
    </div>
  )
}

export default function InvestmentsPage() {
  const {
    investments,
    investmentPositions,
    selectedInvestmentId,
    loadCatalog,
    selectInvestment,
    investProduct,
  } = usePlatformStore(
    useShallow((state) => ({
      investments: state.investments,
      investmentPositions: state.investmentPositions,
      selectedInvestmentId: state.selectedInvestmentId,
      loadCatalog: state.loadCatalog,
      selectInvestment: state.selectInvestment,
      investProduct: state.investProduct,
    }))
  )
  const { assets, loadWallet, displayCurrency } = useWalletStore(
    useShallow((state) => ({
      assets: state.assets,
      loadWallet: state.loadWallet,
      displayCurrency: state.displayCurrency,
    }))
  )

  const [selectedCategory, setSelectedCategory] = useState<'All' | InvestmentCategory>('All')
  const [amount, setAmount] = useState('')
  const [detailModalOpen, setDetailModalOpen] = useState(false)
  const [renderTimestamp] = useState(() => Math.floor(Date.now() / 1000))
  const [pageLoading, setPageLoading] = useState(true)
  const [investing, setInvesting] = useState(false)

  useEffect(() => {
    void Promise.all([loadCatalog(), loadWallet()]).finally(() => setPageLoading(false))
  }, [loadCatalog, loadWallet])

  const visibleInvestments = useMemo(
    () =>
      selectedCategory === 'All'
        ? investments
        : investments.filter((investment) => investment.category === selectedCategory),
    [investments, selectedCategory]
  )

  const selectedInvestment =
    visibleInvestments.find((investment) => investment.id === selectedInvestmentId) ??
    visibleInvestments[0] ??
    null

  const fiatAsset = assets.find((asset) => asset.assetType === 'fiat')
  const maxApy = useMemo(() => {
    if (!investments.length) return '0%'
    return `${Math.max(...investments.map((investment) => investment.apy)).toFixed(1)}%`
  }, [investments])
  const investedCapital = useMemo(
    () => investmentPositions.reduce((sum, position) => sum + position.amount, 0),
    [investmentPositions]
  )

  const currentPosition =
    investmentPositions.find((position) => position.productId === selectedInvestment?.id) ?? null

  const runningPositions = useMemo(() => {
    return investmentPositions
      .map((position) => {
        const product = investments.find((item) => item.id === position.productId)
        if (!product) return null
        const roi = estimatePositionRoi(product, position, renderTimestamp)
        return { position, product, roi }
      })
      .filter((row): row is NonNullable<typeof row> => row !== null)
  }, [investmentPositions, investments, renderTimestamp])

  const handleInvest = () => {
    if (!selectedInvestment) return
    setInvesting(true)
    void (async () => {
      const result = await investProduct(selectedInvestment.id, Number(amount || selectedInvestment.minAmount))
      setInvesting(false)
      if (result.ok) {
        toast.success(result.message)
      } else {
        toast.error(result.message)
      }
    })()
  }

  return (
    <div className="space-y-6">
      <PageHero
        backTo="/wallet"
        backLabel="Back to Wallet"
        title="Short-term, long-term, and retirement mandates"
        description="Each investment mandate is funded from the fiat wallet, surfaced through the shared store, and structured like a real allocation desk rather than a crypto-only placeholder. That gives us a cleaner production path for managed products."  
        stats={[
          { label: 'Active Positions', value: `${investmentPositions.length} mandates` },
          {
            label: 'Capital Deployed',
            value: `${formatCurrency(investedCapital, 'USD')} · ${formatUsdAndAccountFiat(investedCapital, displayCurrency).fiat}`,
          },
          {
            label: 'Cash Available',
            value: fiatAsset
              ? `${safeFormatCurrency(fiatAsset.userBalance, displayCurrency.code)} (~${formatCurrency(fiatAsset.userBalance * displayCurrency.usdPerUnit, 'USD')})`
              : 'Unavailable',
          },
          { label: 'Top Yield', value: maxApy },
        ]}

      />

      {runningPositions.length > 0 ? (
        <section className="gradient-background rounded-2xl border border-neutral-800/80 p-5 space-y-4">
          <div>
            <div className="text-xs uppercase tracking-[0.16em] text-neutral-500">Portfolio</div>
            <h2 className="text-lg font-semibold text-neutral-100 mt-1">Running investments</h2>
            <p className="text-xs text-neutral-500 mt-1">
              Estimated accrued return from APY and time in mandate (indicative only).
            </p>
          </div>

          <div className="md:hidden space-y-3">
            {runningPositions.map(({ position, product, roi }) => (
              <div
                key={position.productId}
                className="rounded-2xl border border-neutral-800 bg-neutral-950/60 p-4 space-y-2"
              >
                <div className="font-semibold text-neutral-100">{product.name}</div>
                <div className="text-xs text-neutral-500">{product.category}</div>
                <div className="flex flex-wrap justify-between gap-2 text-xs pt-2 border-t border-neutral-800/80">
                  <span className="text-neutral-500">Deployed</span>
                  <span className="text-sky-300">{formatCurrency(position.amount, 'USD')}</span>
                </div>
                <div className="flex flex-wrap justify-between gap-2 text-xs">
                  <span className="text-neutral-500">Est. gain</span>
                  <span className="text-green-300">+{formatCurrency(roi.gainUsd, 'USD')}</span>
                </div>
                <div className="flex flex-wrap justify-between gap-2 text-xs">
                  <span className="text-neutral-500">Est. ROI</span>
                  <span className="text-green-300">+{roi.roiPct.toFixed(2)}%</span>
                </div>
                <div className="text-[10px] text-neutral-600">
                  Since{' '}
                  {new Date(position.startedAt * 1000).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                  })}
                </div>
              </div>
            ))}
          </div>

          <div className="hidden md:block overflow-x-auto scrollbar-none">
            <table className="w-full min-w-[640px] text-sm border-separate border-spacing-0">
              <thead>
                <tr className="text-left text-xs text-neutral-500 border-b border-neutral-800">
                  <th className="pb-3 font-medium">Mandate</th>
                  <th className="pb-3 font-medium">Category</th>
                  <th className="pb-3 font-medium">Deployed</th>
                  <th className="pb-3 font-medium">Est. gain</th>
                  <th className="pb-3 font-medium">Est. ROI</th>
                  <th className="pb-3 font-medium">Since</th>
                </tr>
              </thead>
              <tbody>
                {runningPositions.map(({ position, product, roi }) => (
                  <tr key={position.productId} className="border-b border-neutral-800/60">
                    <td className="py-3 pr-3 font-medium text-neutral-100">{product.name}</td>
                    <td className="py-3 pr-3 text-xs text-neutral-400">{product.category}</td>
                    <td className="py-3 pr-3 text-sky-300">{formatCurrency(position.amount, 'USD')}</td>
                    <td className="py-3 pr-3 text-green-300">+{formatCurrency(roi.gainUsd, 'USD')}</td>
                    <td className="py-3 pr-3 text-green-300">+{roi.roiPct.toFixed(2)}%</td>
                    <td className="py-3 text-neutral-500 text-xs">
                      {new Date(position.startedAt * 1000).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      ) : null}

      <div className="gradient-background rounded-2xl border border-neutral-800/80 p-4">
        <div className="flex flex-wrap gap-2">
          {investmentCategories.map((category) => (
            <button
              key={category}
              type="button"
              onClick={() => {
                setSelectedCategory(category)
                const nextItems =
                  category === 'All'
                    ? investments
                    : investments.filter((investment) => investment.category === category)
                if (nextItems[0]) {
                  selectInvestment(nextItems[0].id)
                  setAmount(String(nextItems[0].minAmount))
                }
              }}
              className={`rounded-full px-3 py-1! text-xs transition-all ${
                selectedCategory === category
                  ? 'bg-linear-to-r from-green-500/18 via-green-500/10 to-transparent text-green-300 '
                  : ' text-neutral-500 hover:text-neutral-300'
              }`}
            >
              {category}
            </button>
          ))}
        </div>
      </div>

      {pageLoading ? (
        <div className="space-y-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="gradient-background rounded-2xl border border-neutral-800/40 h-[200px] animate-pulse" />
          ))}
        </div>
      ) : null}

      <div className="space-y-4" style={{ display: pageLoading ? 'none' : undefined }}>
          {visibleInvestments.map((investment) => {
            const activePosition = investmentPositions.find(
              (position) => position.productId === investment.id
            )

            return (
              <button
                key={investment.id}
                type="button"
                onClick={() => {
                  selectInvestment(investment.id)
                  setAmount(String(investment.minAmount))
                  setDetailModalOpen(true)
                }}
                className={`w-full text-left gradient-background rounded-2xl border p-5 transition-all ${
                  selectedInvestment?.id === investment.id
                    ? 'border-green-500/30'
                    : 'border-neutral-800/80 hover:border-neutral-700'
                }`}
              >
                <div className="flex flex-col gap-4">
                  <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                    <div className="max-w-3xl">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-lg font-semibold text-neutral-100">{investment.name}</span>
                        <GradientBadge tone={investmentCategoryTone(investment.category)} size="xxs">
                          {investment.category}
                        </GradientBadge>
                        <GradientBadge tone={keywordTone(investment.vehicle)} size="xxs">
                          {investment.vehicle}
                        </GradientBadge>
                        <GradientBadge tone={riskTone(investment.risk)} size="xxs">
                          {investment.risk} risk
                        </GradientBadge>
                      </div>
                      <p className="mt-2 text-sm text-neutral-500">{investment.subtitle}</p>
                      <p className="mt-3 text-xs text-neutral-400">{investment.description}</p>
                    </div>

                  </div>

                  <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
                    <MetricPanel label="Yield" value={`${investment.apy}% APY`} accent="text-green-300" />
                    <MetricPanel label="Term" value={formatTerm(investment.termDays)} />
                    <MetricPanel
                      label="Minimum"
                      value={`${formatUsdAndAccountFiat(investment.minAmount, displayCurrency).usd} · ${formatUsdAndAccountFiat(investment.minAmount, displayCurrency).fiat}`}
                    />
                    <MetricPanel label="Liquidity" value={investment.liquidity} />
                    <MetricPanel label="Distribution" value={investment.distribution} />
                    <MetricPanel
                      label="Your Position"
                      value={activePosition ? formatCurrency(activePosition.amount, 'USD') : 'No allocation'}
                      accent={activePosition ? 'text-sky-300' : undefined}
                    />
                  </div>

                </div>
              </button>
            )
          })}

        {visibleInvestments.length === 0 ? (
          <div className="gradient-background rounded-2xl border border-neutral-800/80 p-8 text-center text-neutral-500">
            <i className="fi fi-rr-search-alt text-3xl mb-3 opacity-60" />
            <p className="text-sm">No mandates match the selected category.</p>
          </div>
        ) : null}
      </div>

      <Modal
        isOpen={detailModalOpen && !!selectedInvestment}
        onClose={() => setDetailModalOpen(false)}
        title={selectedInvestment?.name ?? 'Mandate'}
        className="max-w-2xl! w-[min(96vw,36rem)] max-h-[min(90vh,44rem)]"
      >
        {selectedInvestment ? (
          <div className="space-y-5">
            <div>
              <div className="text-xs uppercase tracking-[0.16em] text-neutral-500">Selected Mandate</div>
              <p className="text-sm text-neutral-400 mt-2">{selectedInvestment.description}</p>
              <div className="mt-4 flex flex-wrap gap-2">
                <GradientBadge tone={investmentCategoryTone(selectedInvestment.category)} size="xs">
                  {selectedInvestment.category}
                </GradientBadge>
                <GradientBadge tone={keywordTone(selectedInvestment.vehicle)} size="xs">
                  {selectedInvestment.vehicle}
                </GradientBadge>
                <GradientBadge tone={riskTone(selectedInvestment.risk)} size="xs">
                  {selectedInvestment.risk} risk
                </GradientBadge>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <MetricPanel label="Liquidity" value={selectedInvestment.liquidity} />
              <MetricPanel label="Funded" value={`${selectedInvestment.fundedPct}%`} />
              <MetricPanel label="Distribution" value={selectedInvestment.distribution} />
              <MetricPanel label="Term" value={formatTerm(selectedInvestment.termDays)} />
            </div>

            <div className="rounded-2xl border border-neutral-800 bg-neutral-950/60 p-4">
              <div className="text-[11px] uppercase tracking-[0.16em] text-neutral-500">Suitable For</div>
              <p className="mt-2 text-sm text-neutral-300">{selectedInvestment.suitableFor}</p>
            </div>

            <div className="rounded-2xl border border-neutral-800 bg-neutral-950/60 p-4">
              <div className="text-[11px] uppercase tracking-[0.16em] text-neutral-500">Exposure Focus</div>
              <div className="mt-3 flex flex-wrap gap-2">
                {selectedInvestment.focus.map((focus) => (
                  <GradientBadge key={focus} tone={keywordTone(focus)} size="xs">
                    {focus}
                  </GradientBadge>
                ))}
              </div>
            </div>

            <div className="rounded-2xl border border-neutral-800 bg-neutral-950/60 p-4 space-y-3">
              <div className="text-[11px] uppercase tracking-[0.16em] text-neutral-500">Subscription Size</div>
              <input
                type="text"
                value={amount || String(selectedInvestment.minAmount)}
                onChange={(event) => {
                  const value = event.target.value
                  if (/^\d*\.?\d*$/.test(value)) setAmount(value)
                }}
                className="w-full rounded-xl border border-neutral-800 bg-neutral-900/80 px-4 py-3 text-sm text-neutral-100 outline-none focus:border-green-500/30"
              />
              <div className="flex items-center justify-between text-xs text-neutral-500">
                <span>Minimum ticket</span>
                <span>
                  {formatUsdAndAccountFiat(selectedInvestment.minAmount, displayCurrency).usd} (
                  {formatUsdAndAccountFiat(selectedInvestment.minAmount, displayCurrency).fiat})
                </span>
              </div>
              <div className="flex items-center justify-between text-xs text-neutral-500">
                <span>Your current position</span>
                <span>
                  {currentPosition
                    ? `${formatCurrency(currentPosition.amount, 'USD')} (${formatUsdAndAccountFiat(currentPosition.amount, displayCurrency).fiat})`
                    : 'No allocation'}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs text-neutral-500">
                <span>Funding source</span>
                <span>
                  {fiatAsset
                    ? `${safeFormatCurrency(fiatAsset.userBalance, displayCurrency.code)} (~${formatCurrency(fiatAsset.userBalance * displayCurrency.usdPerUnit, 'USD')})`
                    : 'Unavailable'}
                </span>
              </div>
            </div>

            <div className="rounded-2xl border border-green-500/20 bg-green-500/10 p-4">
              <div className="text-sm font-semibold text-green-300">Funding Path</div>
              <p className="mt-2 text-xs text-green-100/80">
                Subscriptions debit from the fiat wallet first, then settle into managed positions held in the platform store.
              </p>
            </div>

            <button
              type="button"
              onClick={handleInvest}
              disabled={investing}
              className="w-full rounded-full bg-green-500/15 hover:bg-green-500/25 px-4 py-3 text-sm font-medium text-green-300 disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {investing ? (
                <>
                  <i className="fi fi-rr-spinner animate-spin" />
                  <span>Investing…</span>
                </>
              ) : (
                <>
                  <span>Subscribe</span>
                  <span>
                    {formatUsdAndAccountFiat(
                      Number(amount || selectedInvestment.minAmount),
                      displayCurrency
                    ).usd}{' '}
                    ({formatUsdAndAccountFiat(Number(amount || selectedInvestment.minAmount), displayCurrency).fiat})
                  </span>
                </>
              )}
            </button>
          </div>
        ) : null}
      </Modal>
    </div>
  )
}
