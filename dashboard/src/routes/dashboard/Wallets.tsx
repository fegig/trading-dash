import { useEffect, useMemo, useRef, useState } from 'react'
import { toast } from 'react-toastify'
import { useShallow } from 'zustand/react/shallow'
import AccountBalance from '@/components/wallet/AccountBalance'
import AssetsList from '@/components/wallet/AssetsList'
import TransactionHistory from '@/components/wallet/TransactionHistory'
import { useWalletStore } from '@/stores'
import { formatUsdAndAccountFiat, safeFormatCurrency } from '@/util/walletDisplay'

export default function Wallets() {
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const { assets, transactions, loading, loadWallet, convertAssets, displayCurrency } = useWalletStore(
    useShallow((state) => ({
      assets: state.assets,
      transactions: state.transactions,
      loading: state.loading,
      loadWallet: state.loadWallet,
      convertAssets: state.convertAssets,
      displayCurrency: state.displayCurrency,
    }))
  )

  const [fromAssetId, setFromAssetId] = useState('')
  const [toAssetId, setToAssetId] = useState('')
  const [fromAmount, setFromAmount] = useState('')
  const [toAmount, setToAmount] = useState('')
  const [converting, setConverting] = useState(false)

  useEffect(() => {
    void loadWallet(true)
  }, [loadWallet])


  const fiatAsset = assets.find((asset) => asset.assetType === 'fiat')
  const resolvedFromAssetId = fromAssetId || fiatAsset?.walletId || assets[0]?.walletId || ''
  const resolvedToAssetId =
    toAssetId && toAssetId !== resolvedFromAssetId
      ? toAssetId
      : assets.find((asset) => asset.walletId !== resolvedFromAssetId)?.walletId || ''
  const fromAsset =
    assets.find((asset) => asset.walletId === resolvedFromAssetId) ?? fiatAsset ?? assets[0]
  const toAsset =
    assets.find((asset) => asset.walletId === resolvedToAssetId) ??
    assets.find((asset) => asset.walletId !== fromAsset?.walletId)

  const fromPx = Number(fromAsset?.price ?? 0)
  const toPx = Number(toAsset?.price ?? 0)

  const quotePreview = useMemo(() => {
    const rawAmount = Number(fromAmount)
    if (!fromAsset || !toAsset || !Number.isFinite(rawAmount) || rawAmount <= 0) return null
    if (!Number.isFinite(fromPx) || fromPx <= 0 || !Number.isFinite(toPx) || toPx <= 0) return null
    const usdGross = rawAmount * fromPx
    const feeUsd = usdGross * 0.0035
    const usdNet = usdGross - feeUsd
    const toAmountValue = usdNet / toPx
    return { usdGross, feeUsd, usdNet, toAmountValue, rate: fromPx / toPx }
  }, [fromAmount, fromAsset, toAsset, fromPx, toPx])

  const handleFromAmountChange = (value: string) => {
    if (!/^\d*\.?\d*$/.test(value)) return
    setFromAmount(value)
    const raw = Number(value)
    if (fromAsset && toAsset && raw > 0 && fromPx > 0 && toPx > 0) {
      const computed = (raw * fromPx * (1 - 0.0035)) / toPx
      setToAmount(Number(computed.toFixed(8)).toString())
    } else {
      setToAmount('')
    }
  }

  const handleToAmountChange = (value: string) => {
    if (!/^\d*\.?\d*$/.test(value)) return
    setToAmount(value)
    const raw = Number(value)
    if (fromAsset && toAsset && raw > 0 && fromPx > 0 && toPx > 0) {
      // reverse: toAmount = fromAmount * fromPx * 0.9965 / toPx
      //          fromAmount = toAmount * toPx / (fromPx * 0.9965)
      const computed = (raw * toPx) / (fromPx * (1 - 0.0035))
      setFromAmount(Number(computed.toFixed(8)).toString())
    } else {
      setFromAmount('')
    }
  }

  const scrollLeft = () => {
    scrollContainerRef.current?.scrollBy({ left: -320, behavior: 'smooth' })
  }

  const scrollRight = () => {
    scrollContainerRef.current?.scrollBy({ left: 320, behavior: 'smooth' })
  }

  const handleConvert = () => {
    if (!fromAsset || !toAsset) {
      toast.error('Select both source and destination assets.')
      return
    }
    const raw = Number(fromAmount)
    if (!raw || raw <= 0) {
      toast.error('Enter an amount to convert.')
      return
    }
    setConverting(true)
    void (async () => {
      const result = await convertAssets(fromAsset.walletId, toAsset.walletId, raw)
      setConverting(false)
      if (!result.ok) {
        toast.error(result.message)
        return
      }
      toast.success(result.message)
      setFromAmount('')
      setToAmount('')
    })()
  }

  return (
    <div className="space-y-6">

      {loading ? (
        <div className="gradient-background rounded-2xl min-h-[320px] animate-pulse" />
      ) : (
        <>
          <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_24rem] gap-6 items-start">
           <div>
           <AccountBalance userCoins={assets} displayCurrency={displayCurrency} />
           <section className="space-y-4 mt-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-semibold text-neutral-100">Asset inventory</h2>
                  <button
                    type="button"
                    className="rounded-full bg-neutral-900 p-2 py-1 hover:bg-neutral-800/50 smooth flex items-center space-x-2 text-xs"
                  >
                    <i className="fi fi-rr-add text-neutral-500"></i>
                    <span>Add Asset</span>
                  </button>
                </div>
                <p className="text-sm text-neutral-500 mt-1">
                  Review balances, then receive, send, or convert without leaving the wallet.
                </p>
              </div>

              <div className="hidden md:flex items-center gap-2">
                <button
                  type="button"
                  onClick={scrollLeft}
                  className="  z-10 w-8 h-8 flex items-center justify-center rounded-full! gradient-background hover:bg-neutral-700/50 transition-all pointer-events-auto"
                  aria-label="Scroll left"
                >
                  <i className="fi fi-rr-angle-left text-sm" />
                </button>
                <button
                  type="button"
                  onClick={scrollRight}
                  className="  z-10 w-8 h-8 flex items-center justify-center rounded-full! gradient-background hover:bg-neutral-700/50 transition-all pointer-events-auto"
                  aria-label="Scroll right"
                >
                  <i className="fi fi-rr-angle-right text-sm" />
                </button>
              </div>
            </div>

            <div ref={scrollContainerRef} className="overflow-x-auto scrollbar-none">
              <div className="flex gap-4 min-w-max">
                <AssetsList
                  userCoins={assets}
                  displayCurrency={displayCurrency}
                  onWalletRefresh={() => void loadWallet(true)}
                />
              </div>
            </div>
          </section>
           </div>

            <div className="gradient-background rounded-2xl border border-neutral-800/80 p-5 space-y-5">
              <div>
                <div className="text-xs uppercase tracking-[0.16em] text-neutral-500">Conversion Desk</div>
                <h2 className="text-xl font-semibold text-neutral-100 mt-2">Move between cash and crypto</h2>
                <p className="text-sm text-neutral-400 mt-2">
                  Convert fiat into execution inventory or rotate profits back into your cash wallet for the next product.
                </p>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] uppercase tracking-[0.16em] text-neutral-500">From</label>
                    <select
                      value={resolvedFromAssetId}
                      onChange={(event) => setFromAssetId(event.target.value)}
                      className="w-full mt-2 bg-neutral-900/80 text-sm text-neutral-100 border border-neutral-800"
                    >
                      {assets.map((asset) => (
                        <option key={asset.walletId} value={asset.walletId}>
                          {asset.coinName} ({asset.coinShort})
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] uppercase tracking-[0.16em] text-neutral-500">To</label>
                    <select
                      value={resolvedToAssetId}
                      onChange={(event) => setToAssetId(event.target.value)}
                      className="w-full mt-2 bg-neutral-900/80 text-sm text-neutral-100 border border-neutral-800"
                    >
                      {assets
                        .filter((asset) => asset.walletId !== resolvedFromAssetId)
                        .map((asset) => (
                          <option key={asset.walletId} value={asset.walletId}>
                            {asset.coinName} ({asset.coinShort})
                          </option>
                        ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] uppercase tracking-[0.16em] text-neutral-500">
                      You send ({fromAsset?.coinShort ?? '—'})
                    </label>
                    <div className="relative mt-2">
                      <input
                        type="text"
                        value={fromAmount}
                        onChange={(e) => handleFromAmountChange(e.target.value)}
                        placeholder="0.00"
                        className="w-full bg-neutral-900/80 text-sm text-neutral-100 border border-neutral-800 pr-14"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-neutral-500 pointer-events-none">
                        {fromAsset?.coinShort}
                      </span>
                    </div>
                  </div>
                  <div>
                    <label className="text-[10px] uppercase tracking-[0.16em] text-neutral-500">
                      You receive ({toAsset?.coinShort ?? '—'})
                    </label>
                    <div className="relative mt-2">
                      <input
                        type="text"
                        value={toAmount}
                        onChange={(e) => handleToAmountChange(e.target.value)}
                        placeholder="0.00"
                        className="w-full bg-neutral-900/80 text-sm text-neutral-100 border border-neutral-800 pr-14"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-neutral-500 pointer-events-none">
                        {toAsset?.coinShort}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-neutral-800 bg-neutral-950/60 p-4 space-y-2 text-sm">
                <div className="flex flex-col gap-0.5 text-neutral-400">
                  <div className="flex items-center justify-between">
                    <span>Converted value (gross)</span>
                    <span className="text-right">
                      {quotePreview
                        ? (() => {
                            const { usd, fiat } = formatUsdAndAccountFiat(
                              quotePreview.usdGross,
                              displayCurrency
                            )
                            return (
                              <span>
                                <span className="text-neutral-200">{fiat}</span>
                                <span className="text-neutral-500 text-xs ml-1">({usd})</span>
                              </span>
                            )
                          })()
                        : '—'}
                    </span>
                  </div>
                </div>
                <div className="flex flex-col gap-0.5 text-neutral-400">
                  <div className="flex items-center justify-between">
                    <span>Fee (0.35%)</span>
                    <span className="text-right">
                      {quotePreview
                        ? (() => {
                            const { usd, fiat } = formatUsdAndAccountFiat(
                              quotePreview.feeUsd,
                              displayCurrency
                            )
                            return (
                              <span>
                                <span className="text-neutral-200">{fiat}</span>
                                <span className="text-neutral-500 text-xs ml-1">({usd})</span>
                              </span>
                            )
                          })()
                        : '—'}
                    </span>
                  </div>
                </div>
                <div className="flex items-center justify-between text-neutral-100">
                  <span>You receive</span>
                  <span>
                    {quotePreview && toAsset
                      ? toAsset.assetType === 'fiat'
                        ? safeFormatCurrency(
                            quotePreview.toAmountValue,
                            toAsset.coinShort || displayCurrency.code
                          )
                        : `${quotePreview.toAmountValue.toFixed(6)} ${toAsset.coinShort}`
                      : '--'}
                  </span>
                </div>
                <div className="text-xs text-neutral-500 border-t border-neutral-800/80 pt-2 mt-1">
                  {quotePreview && fromAsset && toAsset
                    ? `1 ${fromAsset.coinShort} ≈ ${quotePreview.rate.toFixed(8)} ${toAsset.coinShort} · Notional routed in USD for trading`
                    : 'Select assets and enter an amount to preview the conversion.'}
                </div>
              </div>

              <button
                type="button"
                onClick={handleConvert}
                disabled={converting || !quotePreview}
                className="w-full rounded-full bg-green-500/15 hover:bg-green-500/25 px-4 py-3 text-sm font-medium text-green-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {converting ? (
                  <>
                    <i className="fi fi-rr-spinner animate-spin" />
                    <span>Converting…</span>
                  </>
                ) : (
                  'Convert Funds'
                )}
              </button>

              <div className="rounded-2xl border border-green-500/20 bg-green-500/10 p-4">
                <div className="text-sm font-semibold text-green-300">Cash wallet powers the platform</div>
                <p className="text-xs text-green-100/80 mt-2">
                  Live trades, bot purchases, copy trading allocations, and new investments all debit from your fiat wallet first.
                </p>
              </div>
            </div>
          </div>

         

          <TransactionHistory transactions={transactions} />
        </>
      )}
    </div>
  )
}
