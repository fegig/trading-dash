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
