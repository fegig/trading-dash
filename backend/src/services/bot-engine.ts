import { and, count, desc, eq, gt, gte } from 'drizzle-orm'
import type { InferSelectModel } from 'drizzle-orm'
import type { Env } from '../types/env'
import { createDbContext, releaseDbContext } from '../db/client'
import * as schema from '../db/schema'
import { resolveUsdPerFiatUnit } from '../lib/wallet-ledger'
import { selectTradingBotByIdForCatalog } from '../lib/trading-bots-query'
import { fetchUsdSpots } from '../lib/cc-prices'

function utcDayStartUnix(nowSec: number): number {
  const d = new Date(nowSec * 1000)
  return Math.floor(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()) / 1000)
}

/** Parses cadence strings like 15m, 1h, 4h, 1d, daily → minimum seconds between runs per subscription. */
function cadenceToMinIntervalSeconds(cadence: string): number {
  const c = cadence.trim().toLowerCase()
  if (c === 'daily') return 86400
  const m = c.match(/^(\d+)\s*(m|h|d)$/)
  if (m) {
    const n = Number(m[1])
    if (!Number.isFinite(n) || n <= 0) return 3600
    const u = m[2]
    if (u === 'm') return n * 60
    if (u === 'h') return n * 3600
    if (u === 'd') return n * 86400
  }
  return 3600
}

function numOr(v: unknown, fallback: number): number {
  const n = typeof v === 'number' ? v : Number(v)
  return Number.isFinite(n) ? n : fallback
}

/**
 * Scheduled cron: for each active bot subscription, optionally create a completed bot trade.
 * - Respects per-bot max trades per UTC day (counts `bot_trade_runs` for the subscription).
 * - Respects cadence (min seconds since last run for that subscription).
 * - Trade notional (`invested`) scales with user fiat balance (USD equivalent), clamped by bot min/max USD.
 */
export async function runBotCycle(env: Env): Promise<void> {
  const ctx = await createDbContext(env.HYPERDRIVE.connectionString)
  try {
    const { db } = ctx
    const now = Math.floor(Date.now() / 1000)
    const dayStart = utcDayStartUnix(now)

    const subs = await db
      .select()
      .from(schema.userBotSubscriptions)
      .where(gt(schema.userBotSubscriptions.expiresAt, now))

    // Pre-compute every base symbol referenced by active subscriptions so we
    // can batch-fetch them through the cached CryptoCompare helper. This
    // re-uses the `cc:walletusd:<BASE>` KV entries that the wallet /
    // PairBanner / footer / live DO already keep warm, so the cron usually
    // costs 0 CryptoCompare calls instead of one per subscription.
    const bases: string[] = []
    for (const sub of subs) {
      const bot = await selectTradingBotByIdForCatalog(db, sub.botId)
      if (!bot) continue
      const markets = Array.isArray(bot.markets) ? (bot.markets as string[]) : []
      const rawSym = markets[0] ?? 'BTC'
      const base = rawSym.replace(/-.*$/, '').toUpperCase()
      if (base) bases.push(base)
    }
    const spotMap = bases.length > 0 ? await fetchUsdSpots(env, bases) : new Map()

    for (const sub of subs) {
      const bot = await selectTradingBotByIdForCatalog(db, sub.botId)
      if (!bot) continue
      const b = bot as InferSelectModel<typeof schema.tradingBots>

      const maxPerDay = numOr(b.maxTradesPerDay, 4)
      const minInterval = cadenceToMinIntervalSeconds(b.cadence ?? '1h')

      const [{ n: runsToday }] = await db
        .select({ n: count() })
        .from(schema.botTradeRuns)
        .where(
          and(eq(schema.botTradeRuns.subscriptionRowId, sub.id), gte(schema.botTradeRuns.ranAt, dayStart))
        )
      if (Number(runsToday) >= maxPerDay) continue

      const [lastRun] = await db
        .select()
        .from(schema.botTradeRuns)
        .where(eq(schema.botTradeRuns.subscriptionRowId, sub.id))
        .orderBy(desc(schema.botTradeRuns.ranAt))
        .limit(1)
      if (lastRun && now - lastRun.ranAt < minInterval) continue

      const fiat = await resolveUsdPerFiatUnit(env, db, sub.userId)
      if (!fiat) continue

      const balanceUsd = Number(fiat.fiatRow.userBalance) * fiat.usdPerUnit
      if (!Number.isFinite(balanceUsd) || balanceUsd <= 0) continue

      const pct = numOr(b.tradeSizePctOfFiatBalance, 0.05)
      const minU = numOr(b.minTradeSizeUsd, 10)
      const maxU = numOr(b.maxTradeSizeUsd, 500)

      let investedUsd = balanceUsd * pct
      investedUsd = Math.min(investedUsd, maxU)
      if (investedUsd < minU) continue

      investedUsd = Number(investedUsd.toFixed(2))
      if (investedUsd < minU) continue

      const markets = Array.isArray(bot.markets) ? (bot.markets as string[]) : []
      const rawSym = markets[0] ?? 'BTC'
      const base = rawSym.replace(/-.*$/, '').toUpperCase()
      const quote = 'USDT'

      // USD spot is close enough to USDT spot for the majors the bot trades,
      // and the cached helper gives us key rotation + stampede protection
      // plus a shared KV entry with the rest of the app.
      const spot = spotMap.get(base)
      if (!spot || !(spot.usd > 0)) continue

      const strategy = (bot.strategy || '').toLowerCase()
      const chg = spot.changePct24h ?? 0
      let side: 'buy' | 'sell' = 'buy'
      if (strategy.includes('momentum')) {
        side = chg >= 0 ? 'buy' : 'sell'
      } else if (strategy.includes('mean') || strategy.includes('reversion')) {
        side = chg <= 0 ? 'buy' : 'sell'
      } else {
        side = chg >= 0 ? 'buy' : 'sell'
      }

      const price = spot.usd
      const tradeId = crypto.randomUUID()
      const pair = `${base}-${quote}`
      const moveFrac = Math.min(Math.abs(chg) / 100, 0.25)
      const roiVal = Number((investedUsd * moveFrac * 0.12).toFixed(4))
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
        invested: String(investedUsd),
        currency: 'USD',
        closingTime: now,
        closingPrice: String(closePx),
        status: 'completed',
        roi: String(roiVal),
        leverage: 1,
        size: String(investedUsd),
        margin: String(investedUsd),
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
        detailJson: JSON.stringify({
          base,
          quote,
          side,
          price,
          strategy: bot.strategy,
          investedUsd,
          balanceUsdApprox: Number(balanceUsd.toFixed(2)),
          runsToday: Number(runsToday) + 1,
          maxPerDay,
        }),
      })
    }
  } finally {
    await releaseDbContext(ctx)
  }
}
