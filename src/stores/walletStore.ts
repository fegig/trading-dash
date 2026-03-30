import { create } from 'zustand'
import * as walletService from '../services/walletService'
import type { TransactionHistoryProps, UserCoinsProps, WalletConversionQuote } from '../types/wallet'

type WalletState = {
  assets: UserCoinsProps[]
  transactions: TransactionHistoryProps[]
  loading: boolean
  loaded: boolean
  selectedAssetId: string | null
  loadWallet: (force?: boolean) => Promise<void>
  selectAsset: (assetId: string | null) => void
  convertAssets: (
    fromAssetId: string,
    toAssetId: string,
    rawAmount: number
  ) => { ok: boolean; message: string; quote?: WalletConversionQuote }
  spendFiat: (amount: number, note: string, methodName: string) => { ok: boolean; message: string }
}

function createMethodIcon(asset: UserCoinsProps) {
  return asset.iconUrl
    ? { icon: asset.iconUrl, iconClass: undefined }
    : { icon: undefined, iconClass: asset.iconClass ?? 'fi fi-sr-wallet' }
}

export const useWalletStore = create<WalletState>((set, get) => ({
  assets: [],
  transactions: [],
  loading: false,
  loaded: false,
  selectedAssetId: null,
  loadWallet: async (force = false) => {
    if (!force && (get().loading || get().loaded)) return
    set({ loading: true })
    const [assets, transactions] = await Promise.all([
      walletService.getWalletAssets(),
      walletService.getWalletTransactions(),
    ])
    set({
      assets,
      transactions,
      loading: false,
      loaded: true,
      selectedAssetId: assets[0]?.walletId ?? null,
    })
  },
  selectAsset: (assetId) => set({ selectedAssetId: assetId }),
  convertAssets: (fromAssetId, toAssetId, rawAmount) => {
    const { assets, transactions } = get()
    const fromAsset = assets.find((asset) => asset.walletId === fromAssetId)
    const toAsset = assets.find((asset) => asset.walletId === toAssetId)

    if (!fromAsset || !toAsset || fromAsset.walletId === toAsset.walletId) {
      return { ok: false, message: 'Select two different assets to convert.' }
    }

    if (!Number.isFinite(rawAmount) || rawAmount <= 0) {
      return { ok: false, message: 'Enter a valid amount to convert.' }
    }

    if (rawAmount > fromAsset.userBalance) {
      return { ok: false, message: 'Insufficient balance for this conversion.' }
    }

    const fromPrice = Number(fromAsset.price)
    const toPrice = Number(toAsset.price)
    const usdValue = Number((rawAmount * fromPrice).toFixed(2))
    const fee = Number((usdValue * 0.0035).toFixed(2))
    const netUsd = usdValue - fee
    const precision = toAsset.assetType === 'fiat' ? 2 : 6
    const toAmount = Number((netUsd / toPrice).toFixed(precision))
    const rate = Number((fromPrice / toPrice).toFixed(6))
    const quote: WalletConversionQuote = {
      fromAssetId,
      toAssetId,
      fromAmount: rawAmount,
      toAmount,
      rate,
      fee,
      usdValue: netUsd,
    }

    const createdAt = Math.floor(Date.now() / 1000)
    set({
      assets: assets.map((asset) => {
        if (asset.walletId === fromAsset.walletId) {
          return { ...asset, userBalance: Number((asset.userBalance - rawAmount).toFixed(8)) }
        }
        if (asset.walletId === toAsset.walletId) {
          return { ...asset, userBalance: Number((asset.userBalance + toAmount).toFixed(8)) }
        }
        return asset
      }),
      transactions: [
        {
          id: `txn-convert-${createdAt}`,
          type: 'transfer',
          amount: rawAmount,
          eqAmount: netUsd,
          status: 'completed',
          createdAt,
          method: {
            type:
              fromAsset.assetType === 'fiat' || toAsset.assetType === 'fiat' ? 'fiat' : 'crypto',
            name: `${fromAsset.coinShort} to ${toAsset.coinShort}`,
            symbol: toAsset.coinShort,
            ...createMethodIcon(toAsset),
          },
          note: `Converted ${rawAmount} ${fromAsset.coinShort} into ${toAmount} ${toAsset.coinShort}.`,
        },
        ...transactions,
      ],
    })

    return {
      ok: true,
      message: `Converted ${rawAmount} ${fromAsset.coinShort} into ${toAmount} ${toAsset.coinShort}.`,
      quote,
    }
  },
  spendFiat: (amount, note, methodName) => {
    const { assets, transactions } = get()
    const fiatAsset = assets.find((asset) => asset.assetType === 'fiat')
    if (!fiatAsset) {
      return { ok: false, message: 'No fiat funding wallet is available.' }
    }
    if (amount > fiatAsset.userBalance) {
      return { ok: false, message: 'Not enough fiat balance for this action.' }
    }

    const createdAt = Math.floor(Date.now() / 1000)
    set({
      assets: assets.map((asset) =>
        asset.walletId === fiatAsset.walletId
          ? { ...asset, userBalance: Number((asset.userBalance - amount).toFixed(2)) }
          : asset
      ),
      transactions: [
        {
          id: `txn-spend-${createdAt}`,
          type: 'withdrawal',
          amount,
          eqAmount: amount,
          status: 'completed',
          createdAt,
          method: {
            type: 'fiat',
            name: methodName,
            symbol: fiatAsset.coinShort,
            iconClass: 'fi fi-sr-dollar',
          },
          note,
        },
        ...transactions,
      ],
    })

    return { ok: true, message: `${methodName} funded successfully.` }
  },
}))
