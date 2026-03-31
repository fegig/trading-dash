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

/** Auto-close open live-desk trades when mid price touches stored TP/SL. Returns how many were closed. */
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
    const sl = Number(t.sl)
    const tp = Number(t.tp)
    if (!(sl > 0) && !(tp > 0)) continue
    if (!shouldCloseAtPrice(t.option, midPrice, sl, tp)) continue

    const r = await settleTradeClose(env, db, t.id, midPrice, 'Closed: TP/SL (live desk).')
    if (r.ok) closed += 1
  }
  return closed
}
