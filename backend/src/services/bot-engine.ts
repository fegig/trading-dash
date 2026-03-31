import { and, eq, gt } from 'drizzle-orm'
import type { Env } from '../types/env'
import { createDbContext, releaseDbContext } from '../db/client'
import * as schema from '../db/schema'

const CC_DATA = 'https://min-api.cryptocompare.com/data'

/**
 * Hourly cron: for each active bot subscription, evaluate CryptoCompare 24h move vs bot strategy
 * and insert a small completed trade + bump subscription lifetime P&amp;L.
 */
export async function runBotCycle(env: Env): Promise<void> {
  const key = env.CRYPTOCOMPARE_API_KEY?.trim()
  if (!key) return

  const ctx = await createDbContext(env.HYPERDRIVE.connectionString)
  try {
    const { db } = ctx
    const now = Math.floor(Date.now() / 1000)

    const subs = await db
      .select()
      .from(schema.userBotSubscriptions)
      .where(gt(schema.userBotSubscriptions.expiresAt, now))

    for (const sub of subs) {
      const [recent] = await db
        .select()
        .from(schema.botTradeRuns)
        .where(
          and(
            eq(schema.botTradeRuns.subscriptionRowId, sub.id),
            gt(schema.botTradeRuns.ranAt, now - 3600)
          )
        )
        .limit(1)
      if (recent) continue

      const [bot] = await db
        .select()
        .from(schema.tradingBots)
        .where(eq(schema.tradingBots.id, sub.botId))
        .limit(1)
      if (!bot) continue

      const markets = Array.isArray(bot.markets) ? (bot.markets as string[]) : []
      const rawSym = markets[0] ?? 'BTC'
      const base = rawSym.replace(/-.*$/, '').toUpperCase()
      const quote = 'USDT'

      const url = `${CC_DATA}/pricemultifull?fsyms=${encodeURIComponent(base)}&tsyms=${encodeURIComponent(quote)}&api_key=${encodeURIComponent(key)}`
      const res = await fetch(url)
      if (!res.ok) continue
      const j = (await res.json()) as {
        RAW?: Record<string, Record<string, { PRICE?: number; CHANGEPCT24HOUR?: number }>>
      }
      const raw = j.RAW?.[base]?.[quote]
      if (raw?.PRICE == null) continue

      const strategy = (bot.strategy || '').toLowerCase()
      const chg = raw.CHANGEPCT24HOUR ?? 0
      let side: 'buy' | 'sell' = 'buy'
      if (strategy.includes('momentum')) {
        side = chg >= 0 ? 'buy' : 'sell'
      } else if (strategy.includes('mean') || strategy.includes('reversion')) {
        side = chg <= 0 ? 'buy' : 'sell'
      } else {
        side = chg >= 0 ? 'buy' : 'sell'
      }

      const price = raw.PRICE
      const tradeId = crypto.randomUUID()
      const pair = `${base}-${quote}`
      const invested = 100
      const roiVal = Number((Math.abs(chg) * 0.15).toFixed(4))
      const closePx = price * (1 + (side === 'buy' ? 0.0005 : -0.0005))

      await db.insert(schema.trades).values({
        id: tradeId,
        userId: sub.userId,
        pair,
        base,
        quote,
        option: side,
        direction: side === 'buy' ? 'long' : 'short',
        entryTime: now,
        entryPrice: String(price),
        invested: String(invested),
        currency: 'USD',
        closingTime: now,
        closingPrice: String(closePx),
        status: 'completed',
        roi: String(roiVal),
        leverage: 1,
        size: String(invested),
        margin: String(invested),
        marginPercentage: '100',
        marginType: 'cross',
        pnl: String(roiVal),
        sl: '0',
        tp: '0',
        fees: '0.25',
        liquidationPrice: '0',
        marketPrice: String(price),
        strategy: bot.strategy,
        confidence: 55,
        riskReward: '1:2',
        note: `Auto trade from ${bot.name} (cron)`,
        setup: 'bot-cron',
        fundedWith: 'fiat',
        executionVenue: 'bot-auto',
        tags: [bot.id],
      })

      const newPnl = Number(sub.lifetimePnlUsd) + roiVal
      await db
        .update(schema.userBotSubscriptions)
        .set({ lifetimePnlUsd: String(newPnl) })
        .where(eq(schema.userBotSubscriptions.id, sub.id))

      await db.insert(schema.botTradeRuns).values({
        id: crypto.randomUUID(),
        userId: sub.userId,
        botId: sub.botId,
        subscriptionRowId: sub.id,
        ranAt: now,
        tradesCreated: 1,
        detailJson: JSON.stringify({ base, quote, side, price, strategy: bot.strategy }),
      })
    }
  } finally {
    await releaseDbContext(ctx)
  }
}
