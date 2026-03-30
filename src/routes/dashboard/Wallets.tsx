import { useEffect, useMemo, useRef, useState } from 'react'
import { toast } from 'react-toastify'
import { useShallow } from 'zustand/react/shallow'
import AccountBalance from '@/components/wallet/AccountBalance'
import AssetsList from '@/components/wallet/AssetsList'
import TransactionHistory from '@/components/wallet/TransactionHistory'
import { useWalletStore } from '@/stores'
import { formatCurrency } from '@/util/formatCurrency'

export default function Wallets() {
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const { assets, transactions, loading, loadWallet, convertAssets } = useWalletStore(
    useShallow((state) => ({
      assets: state.assets,
      transactions: state.transactions,
      loading: state.loading,
      loadWallet: state.loadWallet,
      convertAssets: state.convertAssets,
    }))
  )

  const [fromAssetId, setFromAssetId] = useState('')
  const [toAssetId, setToAssetId] = useState('')
  const [amount, setAmount] = useState('')

  useEffect(() => {
    void loadWallet()
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

  const quotePreview = useMemo(() => {
    const rawAmount = Number(amount)
    if (!fromAsset || !toAsset || !Number.isFinite(rawAmount) || rawAmount <= 0) return null
    const usdValue = rawAmount * Number(fromAsset.price)
    const fee = usdValue * 0.0035
    const toAmountValue = (usdValue - fee) / Number(toAsset.price)
    return {
      usdValue,
      fee,
      toAmountValue,
      rate: Number(fromAsset.price) / Number(toAsset.price),
    }
  }, [amount, fromAsset, toAsset])

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
    const result = convertAssets(fromAsset.walletId, toAsset.walletId, Number(amount))
    if (!result.ok) {
      toast.error(result.message)
      return
    }
    toast.success(result.message)
    setAmount('')
  }

  return (
    <div className="space-y-6">

      {loading ? (
        <div className="gradient-background rounded-2xl min-h-[320px] animate-pulse" />
      ) : (
        <>
          <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_24rem] gap-6 items-start">
           <div>
           <AccountBalance userCoins={assets} />
           <section className="space-y-4 mt-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-semibold text-neutral-100">Asset inventory</h2>
                  <button className="rounded-full bg-neutral-900 p-2 py-1 hover:bg-neutral-800/50 smooth flex items-center space-x-2 text-xs">
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
                <AssetsList userCoins={assets} />
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

                <div>
                  <label className="text-[10px] uppercase tracking-[0.16em] text-neutral-500">Amount</label>
                  <input
                    type="text"
                    value={amount}
                    onChange={(event) => {
                      const value = event.target.value
                      if (/^\d*\.?\d*$/.test(value)) setAmount(value)
                    }}
                    placeholder="0.00"
                    className="w-full mt-2 bg-neutral-900/80 text-sm text-neutral-100 border border-neutral-800"
                  />
                </div>
              </div>

              <div className="rounded-2xl border border-neutral-800 bg-neutral-950/60 p-4 space-y-2 text-sm">
                <div className="flex items-center justify-between text-neutral-400">
                  <span>Converted value</span>
                  <span>{quotePreview ? formatCurrency(quotePreview.usdValue, 'USD') : '$0.00'}</span>
                </div>
                <div className="flex items-center justify-between text-neutral-400">
                  <span>Fee</span>
                  <span>{quotePreview ? formatCurrency(quotePreview.fee, 'USD') : '$0.00'}</span>
                </div>
                <div className="flex items-center justify-between text-neutral-100">
                  <span>You receive</span>
                  <span>
                    {quotePreview && toAsset
                      ? toAsset.assetType === 'fiat'
                        ? formatCurrency(quotePreview.toAmountValue, toAsset.coinShort)
                        : `${quotePreview.toAmountValue.toFixed(6)} ${toAsset.coinShort}`
                      : '--'}
                  </span>
                </div>
                <div className="text-xs text-neutral-500">
                  {quotePreview && fromAsset && toAsset
                    ? `1 ${fromAsset.coinShort} ~= ${quotePreview.rate.toFixed(6)} ${toAsset.coinShort}`
                    : 'Select assets and enter an amount to preview the conversion.'}
                </div>
              </div>

              <button
                type="button"
                onClick={handleConvert}
                className="w-full rounded-full bg-green-500/15 hover:bg-green-500/25 px-4 py-3 text-sm font-medium text-green-300"
              >
                Convert Funds
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
