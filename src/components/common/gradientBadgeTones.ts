import { TransactionStatus } from '@/types/wallet'
import type { RiskLevel } from '../../types/platform'
import type { TradeDirection, TradeSide, TradeStatus } from '../../types/trade'

export type GradientBadgeTone =
  | 'neutral'
  | 'emerald'
  | 'green'
  | 'red'
  | 'sky'
  | 'rose'
  | 'violet'
  | 'amber'

export function tradeStatusTone(status: TradeStatus): GradientBadgeTone {
  switch (status) {
    case 'open':
      return 'sky'
    case 'pending':
      return 'amber'
    case 'completed':
      return 'green'
    case 'canceled':
      return 'red'
    default:
      return 'neutral'
  }
}

export function transactionStatusTone(status: TransactionStatus): GradientBadgeTone {
  switch (status) {
    case 'completed':
      return 'green'
    case 'pending':
      return 'amber'
    case 'failed':
      return 'red'
    default:
      return 'neutral'
  }
}

export function tradeDirectionTone(direction: TradeDirection): GradientBadgeTone {
  return direction === 'long' ? 'green' : 'red'
}

export function tradeSideTone(side: TradeSide): GradientBadgeTone {
  return side === 'buy' ? 'green' : 'red'
}

export function riskTone(risk: RiskLevel): GradientBadgeTone {
  switch (risk) {
    case 'Low':
      return 'green'
    case 'Moderate':
      return 'amber'
    case 'High':
      return 'red'
    default:
      return 'neutral'
  }
}

export function capacityTone(capacity: 'Open' | 'Limited'): GradientBadgeTone {
  return capacity === 'Open' ? 'green' : 'amber'
}

export function investmentCategoryTone(category: string): GradientBadgeTone {
  switch (category) {
    case 'Short Term':
      return 'red'
    case 'Long Term':
      return 'green'
    case 'Retirement':
      return 'sky'
    default:
      return 'neutral'
  }
}

export function keywordTone(label: string): GradientBadgeTone {
  const value = label.toLowerCase()

  if (
    ['open', 'active', 'verified', 'momentum', 'trend', 'growth', 'funding', 'spot'].some(
      (keyword) => value.includes(keyword)
    )
  ) {
    return 'green'
  }

  if (
    ['pending', 'review', 'limited', 'watch', 'income', 'retirement', 'treasury', 'yield'].some(
      (keyword) => value.includes(keyword)
    )
  ) {
    return 'amber'
  }

  if (
    ['short', 'cancel', 'risk', 'drawdown', 'fade', 'news', 'guardrail'].some((keyword) =>
      value.includes(keyword)
    )
  ) {
    return 'neutral'
  }

  if (
    ['401', 'index', 'balanced', 'allocation', 'mandate', 'global'].some((keyword) =>
      value.includes(keyword)
    )
  ) {
    return 'sky'
  }

  return 'neutral'
}
