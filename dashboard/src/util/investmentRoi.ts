import type { InvestmentPosition, InvestmentProduct } from '../types/platform'

/** Simple accrual estimate for desk UI (not a ledger). */
export function estimatePositionRoi(
  product: InvestmentProduct,
  position: InvestmentPosition,
  nowSec: number
) {
  const elapsedSec = Math.max(0, nowSec - position.startedAt)
  const elapsedDays = elapsedSec / 86400
  const accrualDays = Math.min(elapsedDays, product.termDays)
  const gainUsd = position.amount * (product.apy / 100) * (accrualDays / 365)
  const roiPct = position.amount > 0 ? (gainUsd / position.amount) * 100 : 0
  return { gainUsd, roiPct, accrualDays }
}
