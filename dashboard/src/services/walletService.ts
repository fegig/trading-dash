import type { TransactionHistoryProps, UserCoinsProps, WalletAssetsApiResponse } from '../types/wallet'
import { get, post } from '../util/request'
import { endpoints } from './endpoints'

const DEFAULT_DISPLAY: WalletAssetsApiResponse['displayCurrency'] = {
  code: 'USD',
  name: 'US Dollar',
  usdPerUnit: 1,
}

export async function getWalletAssets(): Promise<WalletAssetsApiResponse> {
  const res = await get(endpoints.wallet.assets)
  if (res && typeof res === 'object' && Array.isArray((res as WalletAssetsApiResponse).assets)) {
    const bundle = res as WalletAssetsApiResponse
    const dc = bundle.displayCurrency
    return {
      displayCurrency: {
        code: typeof dc?.code === 'string' && dc.code.trim() ? dc.code.trim().toUpperCase() : 'USD',
        name: typeof dc?.name === 'string' && dc.name.trim() ? dc.name.trim() : DEFAULT_DISPLAY.name,
        usdPerUnit:
          typeof dc?.usdPerUnit === 'number' && Number.isFinite(dc.usdPerUnit) && dc.usdPerUnit > 0
            ? dc.usdPerUnit
            : 1,
      },
      assets: bundle.assets as UserCoinsProps[],
    }
  }
  // Legacy array-only response
  if (Array.isArray(res)) {
    return { displayCurrency: DEFAULT_DISPLAY, assets: res as UserCoinsProps[] }
  }
  return { displayCurrency: DEFAULT_DISPLAY, assets: [] }
}

export async function getWalletTransactions(): Promise<TransactionHistoryProps[]> {
  const res = await get(endpoints.wallet.transactions)
  return Array.isArray(res) ? (res as TransactionHistoryProps[]) : []
}

export async function postWalletConvert(
  fromWalletId: string,
  toWalletId: string,
  fromAmount: number
): Promise<
  | {
      ok: true
      fromAmount: number
      toAmount: number
      usdGross: number
      feeUsd: number
      netUsd: number
    }
  | { ok: false; message: string }
> {
  const res = await post(endpoints.wallet.convert, { fromWalletId, toWalletId, fromAmount })
  if (!res || typeof res !== 'object' || !('status' in res)) {
    return { ok: false, message: 'Network error' }
  }
  if (res.status !== 200) {
    const err = (res.data as { error?: string } | undefined)?.error
    return { ok: false, message: err ?? 'Conversion failed' }
  }
  const d = res.data as {
    ok?: boolean
    fromAmount?: number
    toAmount?: number
    usdGross?: number
    feeUsd?: number
    netUsd?: number
    error?: string
  }
  if (
    d.fromAmount != null &&
    d.toAmount != null &&
    d.usdGross != null &&
    d.feeUsd != null &&
    d.netUsd != null
  ) {
    return {
      ok: true,
      fromAmount: d.fromAmount,
      toAmount: d.toAmount,
      usdGross: d.usdGross,
      feeUsd: d.feeUsd,
      netUsd: d.netUsd,
    }
  }
  return { ok: false, message: d.error ?? 'Conversion failed' }
}
