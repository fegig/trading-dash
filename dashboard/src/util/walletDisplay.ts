import { formatCurrency } from './formatCurrency'
import type { WalletDisplayCurrency } from '@/types/wallet'

function safeFormatCurrency(value: number, code: string, decimals = 2): string {
  const c = typeof code === 'string' && /^[A-Z]{3}$/i.test(code.trim()) ? code.trim().toUpperCase() : 'USD'
  try {
    return formatCurrency(value, c, decimals)
  } catch {
    return formatCurrency(value, 'USD', decimals)
  }
}

/** Convert a USD amount to the user's account fiat using live FX (usdPerUnit = USD per 1 account unit). */
export function usdToAccountFiatAmount(usd: number, display: WalletDisplayCurrency): number {
  const r = display.usdPerUnit
  if (!Number.isFinite(usd) || !Number.isFinite(r) || r <= 0) return 0
  return usd / r
}

/** Account-currency units → USD (e.g. EUR × usdPerEUR). */
export function accountFiatToUsd(fiatAmount: number, display: WalletDisplayCurrency): number {
  const r = display.usdPerUnit
  if (!Number.isFinite(fiatAmount) || !Number.isFinite(r) || r <= 0) return 0
  return fiatAmount * r
}

/**
 * Interpret wallet amount field: native asset units, or account-fiat units (converted via USD).
 * `unitUsd` = USD per 1 native unit (from `coin.price`).
 */
export function parseCryptoAmountFromInput(
  raw: string,
  mode: 'native' | 'account',
  unitUsd: number,
  display: WalletDisplayCurrency
): number | null {
  const v = parseFloat(raw)
  if (!Number.isFinite(v) || v <= 0) return null
  if (!Number.isFinite(unitUsd) || unitUsd <= 0) return null
  if (mode === 'native') return v
  const usd = accountFiatToUsd(v, display)
  if (!Number.isFinite(usd) || usd <= 0) return null
  return usd / unitUsd
}

export function formatUsdAndAccountFiat(
  usd: number,
  display: WalletDisplayCurrency,
  usdDecimals = 2,
  fiatDecimals = 2
): { usd: string; fiat: string } {
  const fiatAmt = usdToAccountFiatAmount(usd, display)
  return {
    usd: formatCurrency(usd, 'USD', usdDecimals),
    fiat: safeFormatCurrency(fiatAmt, display.code, fiatDecimals),
  }
}

export { safeFormatCurrency }
