import { and, eq } from 'drizzle-orm'
import type { Env } from '../types/env'
import { createDbContext, releaseDbContext } from '../db/client'
import * as schema from '../db/schema'
import { fetchSpotUsdForBase } from '../lib/cc-prices'
import { evaluateLiveTpslForPair } from '../lib/live-tpsl-eval'

/**
 * Worker cron backup: mark open live-desk trades to market and close on TP/SL using spot prices.
 * Durable Object alarms also run this per pair when the desk is active; this sweep covers idle pairs
 * and environments where DO alarms are delayed.
 */
export async function sweepLiveDeskTpsl(env: Env): Promise<void> {
  const ctxDb = await createDbContext(env.HYPERDRIVE.connectionString)
  try {
    const { db } = ctxDb
    const rows = await db
      .select({ pair: schema.trades.pair })
      .from(schema.trades)
      .where(
        and(eq(schema.trades.executionVenue, 'live'), eq(schema.trades.status, 'open'))
      )
    const uniq = [...new Set(rows.map((r) => r.pair).filter(Boolean))]
    for (const pairUpper of uniq) {
      const base = pairUpper.split(/[-/]/)[0]?.trim() ?? ''
      if (!base) continue
      const spot = await fetchSpotUsdForBase(env, base)
      if (!(spot != null && spot > 0)) continue
      await evaluateLiveTpslForPair(env, db, pairUpper, spot)
    }
  } finally {
    await releaseDbContext(ctxDb)
  }
}
