import { eq } from 'drizzle-orm'
import type { InferSelectModel } from 'drizzle-orm'
import type { MySql2Database } from 'drizzle-orm/mysql2/driver'
import * as schema from '../db/schema'

type AppDb = MySql2Database<typeof schema>

/**
 * Columns that exist on `trading_bots` before `0011_trading_bots_cron_limits.sql`.
 * Drizzle `select()` on the full table generates SQL that lists every schema column;
 * if 0011 is not applied, that fails. We always read these first, then optionally
 * merge cron/limit fields in a second query so missing columns never break the first query.
 */
export const tradingBotsCatalogBaseColumns = {
  id: schema.tradingBots.id,
  name: schema.tradingBots.name,
  strapline: schema.tradingBots.strapline,
  description: schema.tradingBots.description,
  strategy: schema.tradingBots.strategy,
  priceUsd: schema.tradingBots.priceUsd,
  monthlyTarget: schema.tradingBots.monthlyTarget,
  winRate: schema.tradingBots.winRate,
  maxDrawdown: schema.tradingBots.maxDrawdown,
  markets: schema.tradingBots.markets,
  cadence: schema.tradingBots.cadence,
  guardrails: schema.tradingBots.guardrails,
  subscriptionDays: schema.tradingBots.subscriptionDays,
} as const

const tradingBotsCronColumns = {
  id: schema.tradingBots.id,
  maxTradesPerDay: schema.tradingBots.maxTradesPerDay,
  tradeSizePctOfFiatBalance: schema.tradingBots.tradeSizePctOfFiatBalance,
  minTradeSizeUsd: schema.tradingBots.minTradeSizeUsd,
  maxTradeSizeUsd: schema.tradingBots.maxTradeSizeUsd,
} as const

type BotRowFull = InferSelectModel<typeof schema.tradingBots>
type BotRowLegacy = Pick<
  BotRowFull,
  | 'id'
  | 'name'
  | 'strapline'
  | 'description'
  | 'strategy'
  | 'priceUsd'
  | 'monthlyTarget'
  | 'winRate'
  | 'maxDrawdown'
  | 'markets'
  | 'cadence'
  | 'guardrails'
  | 'subscriptionDays'
>

export function tradingBotToCatalogJson(b: BotRowFull | BotRowLegacy) {
  const full = b as BotRowFull
  return {
    id: b.id,
    name: b.name,
    strapline: b.strapline,
    description: b.description,
    strategy: b.strategy,
    priceUsd: Number(b.priceUsd),
    monthlyTarget: b.monthlyTarget,
    winRate: b.winRate,
    maxDrawdown: b.maxDrawdown,
    markets: b.markets,
    cadence: b.cadence,
    guardrails: b.guardrails,
    subscriptionDays: b.subscriptionDays ?? 30,
    maxTradesPerDay: full.maxTradesPerDay ?? 4,
    tradeSizePctOfFiatBalance: Number(full.tradeSizePctOfFiatBalance ?? 0.05),
    minTradeSizeUsd: Number(full.minTradeSizeUsd ?? 10),
    maxTradeSizeUsd: Number(full.maxTradeSizeUsd ?? 500),
  }
}

export async function selectAllTradingBotsCatalog(db: AppDb) {
  const baseRows = await db.select(tradingBotsCatalogBaseColumns).from(schema.tradingBots)
  try {
    const extraRows = await db.select(tradingBotsCronColumns).from(schema.tradingBots)
    const byId = new Map(extraRows.map((r) => [r.id, r]))
    return baseRows.map((b) => {
      const x = byId.get(b.id)
      return (x ? { ...b, ...x } : b) as BotRowFull | BotRowLegacy
    })
  } catch {
    return baseRows as BotRowLegacy[]
  }
}

export async function selectTradingBotByIdForCatalog(db: AppDb, botId: string) {
  const rows = await db
    .select(tradingBotsCatalogBaseColumns)
    .from(schema.tradingBots)
    .where(eq(schema.tradingBots.id, botId))
    .limit(1)
  const base = rows[0]
  if (!base) return null
  try {
    const extraRows = await db
      .select(tradingBotsCronColumns)
      .from(schema.tradingBots)
      .where(eq(schema.tradingBots.id, botId))
      .limit(1)
    const x = extraRows[0]
    return (x ? { ...base, ...x } : base) as BotRowFull | BotRowLegacy
  } catch {
    return base
  }
}
