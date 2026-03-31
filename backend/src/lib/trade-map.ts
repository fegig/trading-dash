import type { TradePosition } from '@trading-dash/shared'
import type { InferSelectModel } from 'drizzle-orm'
import type { trades } from '../db/schema'

type TradeRow = InferSelectModel<typeof trades>

function n(v: string | null | undefined): number {
  if (v == null || v === '') return 0
  const x = Number(v)
  return Number.isFinite(x) ? x : 0
}

export function rowToTradePosition(row: TradeRow): TradePosition {
  const closingTime = row.closingTime == null ? ('pending' as const) : row.closingTime
  const closingPrice =
    row.closingPrice == null ? ('pending' as const) : n(String(row.closingPrice))
  const roi = row.roi == null ? ('pending' as const) : n(String(row.roi))
  return {
    tradeId: row.id,
    pair: row.pair,
    base: row.base,
    quote: row.quote,
    option: row.option,
    direction: row.direction,
    entryTime: row.entryTime,
    entryPrice: n(String(row.entryPrice)),
    invested: n(String(row.invested)),
    currency: row.currency,
    closingTime,
    closingPrice,
    status: row.status,
    roi,
    leverage: row.leverage,
    size: n(String(row.size)),
    margin: n(String(row.margin)),
    marginPercentage: n(String(row.marginPercentage)),
    marginType: row.marginType,
    pnl: n(String(row.pnl)),
    sl: n(String(row.sl)),
    tp: n(String(row.tp)),
    fees: n(String(row.fees)),
    liquidationPrice: n(String(row.liquidationPrice)),
    marketPrice: n(String(row.marketPrice)),
    strategy: row.strategy,
    confidence: row.confidence,
    riskReward: row.riskReward,
    note: row.note,
    setup: row.setup,
    fundedWith: row.fundedWith,
    executionVenue: row.executionVenue,
    tags: Array.isArray(row.tags) ? row.tags : [],
  }
}
