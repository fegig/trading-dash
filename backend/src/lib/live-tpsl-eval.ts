import { and, eq } from 'drizzle-orm'
import type { Env } from '../types/env'
import type { AppVariables } from '../types/env'
import * as schema from '../db/schema'
import { settleTradeClose } from './settle-trade-close'

type Db = AppVariables['db']

function shouldCloseAtPrice(
  option: 'buy' | 'sell',
  price: number,
  sl: number,
  tp: number
): boolean {
  if (!(price > 0)) return false
  if (option === 'buy') {
    if (sl > 0 && price <= sl) return true
    if (tp > 0 && price >= tp) return true
  } else {
    if (sl > 0 && price >= sl) return true
    if (tp > 0 && price <= tp) return true
  }
  return false
}

function unrealizedPnlUsd(
  option: 'buy' | 'sell',
  entryPx: number,
  midPrice: number,
  invested: number,
  fees: number
): number {
  if (!(entryPx > 0) || !(midPrice > 0) || !(invested > 0)) return 0
  let pnlUsd = 0
  if (option === 'buy') {
    pnlUsd = invested * (midPrice / entryPx - 1) - fees
  } else {
    pnlUsd = invested * (entryPx / midPrice - 1) - fees
  }
  return Number(pnlUsd.toFixed(8))
}

/**
 * Mark-to-market open live rows (marketPrice + pnl) then auto-close when `midPrice` hits TP/SL.
 * `midPrice` should be a real spot quote (e.g. CryptoCompare) so the desk progresses with the market.
 */
export async function evaluateLiveTpslForPair(
  env: Env,
  db: Db,
  pairUpper: string,
  midPrice: number
): Promise<number> {
  if (!(midPrice > 0)) return 0

  const rows = await db
    .select()
    .from(schema.trades)
    .where(
      and(
        eq(schema.trades.executionVenue, 'live'),
        eq(schema.trades.status, 'open'),
        eq(schema.trades.pair, pairUpper)
      )
    )

  let closed = 0
  for (const t of rows) {
    const entryPx = Number(t.entryPrice)
    const invested = Number(t.invested)
    const fees = Number(t.fees)
    const pnlUsd = unrealizedPnlUsd(t.option, entryPx, midPrice, invested, fees)

    await db
      .update(schema.trades)
      .set({
        marketPrice: String(midPrice),
        pnl: String(pnlUsd),
      })
      .where(eq(schema.trades.id, t.id))

    const sl = Number(t.sl)
    const tp = Number(t.tp)
    if (!(sl > 0) && !(tp > 0)) continue
    if (!shouldCloseAtPrice(t.option, midPrice, sl, tp)) continue

    const r = await settleTradeClose(env, db, t.id, midPrice, 'Closed: TP/SL (live desk).')
    if (r.ok) closed += 1
  }
  return closed
}
