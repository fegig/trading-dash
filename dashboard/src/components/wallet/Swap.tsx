import { useMemo, useState } from 'react'
import { toast } from 'react-toastify'
import { useShallow } from 'zustand/react/shallow'
import AssetAvatar from '../common/AssetAvatar'
import { useWalletStore } from '@/stores'
import { type UserCoinsProps } from '@/types/wallet'
import { formatCurrency } from '@/util/formatCurrency'
import { formatUsdAndAccountFiat, safeFormatCurrency } from '@/util/walletDisplay'

export default function Swap({ coin }: { coin: UserCoinsProps }) {
  const { assets, convertAssets, displayCurrency } = useWalletStore(
    useShallow((state) => ({
      assets: state.assets,
      convertAssets: state.convertAssets,
      displayCurrency: state.displayCurrency,
    }))
  )

  const [fromAmount, setFromAmount] = useState('')
  const [toAssetId, setToAssetId] = useState('')

  const availableAssets = useMemo(
    () => assets.filter((asset) => asset.walletId !== coin.walletId),
    [assets, coin.walletId]
  )
  const resolvedToAssetId = toAssetId || availableAssets[0]?.walletId || ''
  const targetAsset =
    availableAssets.find((asset) => asset.walletId === resolvedToAssetId) ?? availableAssets[0]
  const rawAmount = Number(fromAmount)

  const quotePreview = useMemo(() => {
    if (!targetAsset || !Number.isFinite(rawAmount) || rawAmount <= 0) return null
    const fromPx = Number(coin.price)
    const toPx = Number(targetAsset.price)
    const usdGross = rawAmount * fromPx
    const feeUsd = usdGross * 0.0035
    const toAmount = (usdGross - feeUsd) / toPx
    return {
      toAmount,
      feeUsd,
      usdGross,
      rate: fromPx / toPx,
    }
  }, [coin.price, rawAmount, targetAsset])

  const handleSwap = () => {
    if (!targetAsset) {
      toast.error('No conversion target is available yet.')
      return
    }

    void (async () => {
      const result = await convertAssets(coin.walletId, targetAsset.walletId, rawAmount)
      if (!result.ok) {
        toast.error(result.message)
        return
      }
      toast.success(result.message)
      setFromAmount('')
    })()
  }

  return (
    <div className="gradient-background p-4 rounded-2xl flex flex-col space-y-5 min-w-sm max-md:min-w-2xs border border-neutral-800/80">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <AssetAvatar
            symbol={coin.coinShort}
            name={coin.coinName}
            assetType={coin.assetType}
            iconUrl={coin.iconUrl}
            iconClass={coin.iconClass}
            sizeClassName="w-10 h-10"
          />
          <div>
            <div className="text-sm font-bold text-neutral-100">{coin.coinName}</div>
            <div className="text-xs text-neutral-500">
              Balance:{' '}
              {coin.assetType === 'fiat'
                ? safeFormatCurrency(coin.userBalance, coin.coinShort)
                : `${coin.userBalance.toFixed(4)} ${coin.coinShort}`}
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-3">
        <label className="text-[10px] uppercase tracking-[0.16em] text-neutral-500">From</label>
        <div className="rounded-2xl border border-neutral-800 bg-neutral-950/60 p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AssetAvatar
                symbol={coin.coinShort}
                name={coin.coinName}
                assetType={coin.assetType}
                iconUrl={coin.iconUrl}
                iconClass={coin.iconClass}
                sizeClassName="w-8 h-8"
              />
              <span className="text-sm font-medium text-neutral-100">{coin.coinShort}</span>
            </div>
            <button
              type="button"
              onClick={() => setFromAmount(String(coin.userBalance))}
              className="text-xs text-green-300 hover:text-green-200"
            >
              MAX
            </button>
          </div>
          <input
            type="text"
            value={fromAmount}
            onChange={(event) => {
              const value = event.target.value
              if (/^\d*\.?\d*$/.test(value)) setFromAmount(value)
            }}
            placeholder="0.00"
            className="w-full bg-transparent text-lg text-white outline-none px-0"
          />
          {fromAmount && quotePreview ? (
            <div className="text-xs text-neutral-500 space-y-0.5">
              <div>
                {(() => {
                  const { fiat, usd } = formatUsdAndAccountFiat(quotePreview.usdGross, displayCurrency)
                  return (
                    <>
                      ≈ {fiat} ({usd} USD)
                    </>
                  )
                })()}
              </div>
            </div>
          ) : null}
        </div>
      </div>

      <div className="flex justify-center">
        <div className="w-10 h-10 rounded-full border border-neutral-800 bg-neutral-950/70 grid place-items-center text-neutral-400">
          <i className="fi fi-rr-refresh" />
        </div>
      </div>

      <div className="space-y-3">
        <label className="text-[10px] uppercase tracking-[0.16em] text-neutral-500">To</label>
        <div className="rounded-2xl border border-neutral-800 bg-neutral-950/60 p-4 space-y-3">
          <select
            value={resolvedToAssetId}
            onChange={(event) => setToAssetId(event.target.value)}
            className="w-full bg-neutral-900/80 text-sm text-neutral-100 border border-neutral-800"
          >
            {availableAssets.map((asset) => (
              <option key={asset.walletId} value={asset.walletId}>
                {asset.coinName} ({asset.coinShort})
              </option>
            ))}
          </select>

          {targetAsset ? (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AssetAvatar
                  symbol={targetAsset.coinShort}
                  name={targetAsset.coinName}
                  assetType={targetAsset.assetType}
                  iconUrl={targetAsset.iconUrl}
                  iconClass={targetAsset.iconClass}
                  sizeClassName="w-8 h-8"
                />
                <div>
                  <div className="text-sm font-medium text-neutral-100">{targetAsset.coinShort}</div>
                  <div className="text-xs text-neutral-500">{targetAsset.coinChain}</div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-sm text-neutral-100">
                  {quotePreview
                    ? targetAsset.assetType === 'fiat'
                      ? safeFormatCurrency(quotePreview.toAmount, targetAsset.coinShort)
                      : `${quotePreview.toAmount.toFixed(6)} ${targetAsset.coinShort}`
                    : '0.00'}
                </div>
                <div className="text-xs text-neutral-500">
                  {quotePreview
                    ? `Fee ${formatUsdAndAccountFiat(quotePreview.feeUsd, displayCurrency).fiat} (${formatCurrency(quotePreview.feeUsd, 'USD')})`
                    : 'Enter amount'}
                </div>
              </div>
            </div>
          ) : null}
        </div>
      </div>

      <div className="rounded-2xl border border-neutral-800 bg-neutral-950/60 p-4 text-xs text-neutral-400 space-y-2">
        <div className="flex items-center justify-between">
          <span>Exchange Rate</span>
          <span>
            1 {coin.coinShort} ~= {quotePreview ? quotePreview.rate.toFixed(6) : '0.000000'}{' '}
            {targetAsset?.coinShort ?? '--'}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span>Conversion fee</span>
          <span>
            {quotePreview
              ? `${formatUsdAndAccountFiat(quotePreview.feeUsd, displayCurrency).fiat} (${formatCurrency(quotePreview.feeUsd, 'USD')})`
              : '—'}
          </span>
        </div>
      </div>

      <button
        type="button"
        onClick={handleSwap}
        className="rounded-full bg-green-500/15 hover:bg-green-500/25 !px-4 !py-2 text-sm text-green-300 font-medium"
      >
        Convert {coin.coinShort}
      </button>
    </div>
  )
}
