import { create } from 'zustand'
import * as walletService from '../services/walletService'
import type {
  TransactionHistoryProps,
  UserCoinsProps,
  WalletConversionQuote,
  WalletDisplayCurrency,
} from '../types/wallet'

const DEFAULT_DISPLAY: WalletDisplayCurrency = {
  code: 'USD',
  name: 'US Dollar',
  usdPerUnit: 1,
}

type WalletState = {
  displayCurrency: WalletDisplayCurrency
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
  ) => Promise<{ ok: boolean; message: string; quote?: WalletConversionQuote }>
  spendFiat: (amount: number, note: string, methodName: string) => { ok: boolean; message: string }
}

function createMethodIcon(asset: UserCoinsProps) {
  return asset.iconUrl
    ? { icon: asset.iconUrl, iconClass: undefined }
    : { icon: undefined, iconClass: asset.iconClass ?? 'fi fi-sr-wallet' }
}

export const useWalletStore = create<WalletState>((set, get) => ({
  displayCurrency: DEFAULT_DISPLAY,
  assets: [],
  transactions: [],
  loading: false,
  loaded: false,
  selectedAssetId: null,
  loadWallet: async (force = false) => {
    if (get().loading) return
    if (!force && get().loaded) return
    // Avoid full-page skeleton on background refresh (e.g. Swap modal open) — that unmounted the modal.
    const quietRefresh = Boolean(force && get().loaded && get().assets.length > 0)
    if (!quietRefresh) set({ loading: true })
    try {
      const [bundle, transactions] = await Promise.all([
        walletService.getWalletAssets(),
        walletService.getWalletTransactions(),
      ])
      set({
        displayCurrency: bundle.displayCurrency,
        assets: bundle.assets,
        transactions,
        loading: false,
        loaded: true,
        selectedAssetId: bundle.assets[0]?.walletId ?? null,
      })
    } catch {
      set({ loading: false })
    }
  },
  selectAsset: (assetId) => set({ selectedAssetId: assetId }),
  convertAssets: async (fromAssetId, toAssetId, rawAmount) => {
    const { assets } = get()
    const fromAsset = assets.find((asset) => asset.walletId === fromAssetId)
    const toAsset = assets.find((asset) => asset.walletId === toAssetId)

    if (!fromAsset || !toAsset || fromAsset.walletId === toAsset.walletId) {
      return { ok: false, message: 'Select two different assets to convert.' }
    }

    if (!Number.isFinite(rawAmount) || rawAmount <= 0) {
      return { ok: false, message: 'Enter a valid amount to convert.' }
    }

    if (rawAmount > fromAsset.userBalance + 1e-12) {
      return { ok: false, message: 'Insufficient balance for this conversion.' }
    }

    const api = await walletService.postWalletConvert(fromAssetId, toAssetId, rawAmount)
    if (!api.ok) {
      return { ok: false, message: api.message }
    }

    const fromPrice = Number(fromAsset.price)
    const toPrice = Number(toAsset.price)
    const rate = toPrice > 0 ? Number((fromPrice / toPrice).toFixed(8)) : 0
    const quote: WalletConversionQuote = {
      fromAssetId,
      toAssetId,
      fromAmount: api.fromAmount,
      toAmount: api.toAmount,
      rate,
      fee: api.feeUsd,
      usdValue: api.netUsd,
    }

    await get().loadWallet(true)
    return {
      ok: true,
      message: `Converted ${api.fromAmount} ${fromAsset.coinShort} into ${api.toAmount} ${toAsset.coinShort}.`,
      quote,
    }
  },
  spendFiat: (amount, note, methodName) => {
    const { assets, transactions, displayCurrency } = get()
    const fiatAsset = assets.find((asset) => asset.assetType === 'fiat')
    if (!fiatAsset) {
      return { ok: false, message: 'No fiat funding wallet is available.' }
    }
    if (amount > fiatAsset.userBalance) {
      return { ok: false, message: 'Not enough fiat balance for this action.' }
    }

    const usdEq = Number((amount * displayCurrency.usdPerUnit).toFixed(2))

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
          eqAmount: usdEq,
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
