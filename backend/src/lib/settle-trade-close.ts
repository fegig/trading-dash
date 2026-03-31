import type { InferSelectModel } from 'drizzle-orm'
import { eq } from 'drizzle-orm'
import type { Env } from '../types/env'
import type { AppVariables } from '../types/env'
import * as schema from '../db/schema'
import { adjustFiatByUsd } from './wallet-ledger'

type Db = AppVariables['db']
type TradeRow = InferSelectModel<typeof schema.trades>

/**
 * Close an open trade at exitPx: PnL, fiat settlement (live margin release), persist row.
 * Use for manual API close and automated TP/SL.
 */
export async function settleTradeClose(
  env: Env,
  db: Db,
  tradeId: string,
  exitPx: number,
  noteSuffix: string
): Promise<{ ok: true; trade: TradeRow } | { ok: false; error: string }> {
  const rows = await db.select().from(schema.trades).where(eq(schema.trades.id, tradeId)).limit(1)
  const t = rows[0]
  if (!t) return { ok: false, error: 'Not found' }
  if (t.status !== 'open' && t.status !== 'pending') {
    return { ok: false, error: 'Trade is not open' }
  }

  const now = Math.floor(Date.now() / 1000)
  const entryPx = Number(t.entryPrice)
  const invested = Number(t.invested)
  const fees = Number(t.fees)
  let pnlUsd = 0
  if (entryPx > 0 && exitPx > 0 && invested > 0) {
    if (t.option === 'buy') {
      pnlUsd = invested * (exitPx / entryPx - 1) - fees
    } else {
      pnlUsd = invested * (entryPx / exitPx - 1) - fees
    }
  }
  pnlUsd = Number(pnlUsd.toFixed(8))
  const roiPct = invested > 0 ? Number(((pnlUsd / invested) * 100).toFixed(4)) : 0

  const marginUsd = Number(t.margin)
  const liveFunded = t.executionVenue === 'live' && t.status === 'open'
  const returnUsd = liveFunded ? marginUsd + pnlUsd : pnlUsd

  const settled = await adjustFiatByUsd(
    env,
    db,
    t.userId,
    returnUsd,
    liveFunded
      ? `Trade close: released margin + P&L (~${returnUsd.toFixed(2)} USD equivalent).`
      : `Trade close: P&L (~${returnUsd.toFixed(2)} USD equivalent).`,
    'Trade settlement'
  )
  if (!settled.ok) return { ok: false, error: settled.error }

  await db
    .update(schema.trades)
    .set({
      status: 'completed',
      closingTime: now,
      closingPrice: String(exitPx),
      roi: String(roiPct),
      pnl: String(pnlUsd),
      marketPrice: String(exitPx),
      note: `${t.note} ${noteSuffix}`,
    })
    .where(eq(schema.trades.id, tradeId))

  const updated = await db.select().from(schema.trades).where(eq(schema.trades.id, tradeId)).limit(1)
  const row = updated[0]
  if (!row) return { ok: false, error: 'Update failed' }
  return { ok: true, trade: row }
}
