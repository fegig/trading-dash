import { Hono } from 'hono'
import { eq } from 'drizzle-orm'
import type { Env } from '../types/env'
import type { AppVariables } from '../types/env'
import { requireUser } from '../middleware/session'
import * as schema from '../db/schema'

const platform = new Hono<{ Bindings: Env; Variables: AppVariables }>()

platform.get('/trading-bots', async (c) => {
  const rows = await c.var.db.select().from(schema.tradingBots)
  return c.json(
    rows.map((b) => ({
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
    }))
  )
})

platform.get('/copy-traders', async (c) => {
  const rows = await c.var.db.select().from(schema.copyTraders)
  return c.json(
    rows.map((t) => ({
      id: t.id,
      name: t.name,
      handle: t.handle,
      specialty: t.specialty,
      followers: t.followers,
      winRate: t.winRate,
      maxDrawdown: t.maxDrawdown,
      minAllocation: t.minAllocation,
      feePct: t.feePct,
      monthlyReturn: t.monthlyReturn,
      bio: t.bio,
      focusPairs: t.focusPairs,
      capacity: t.capacity,
    }))
  )
})

platform.get('/investment-products', async (c) => {
  const rows = await c.var.db.select().from(schema.investmentProducts)
  return c.json(
    rows.map((p) => ({
      id: p.id,
      name: p.name,
      subtitle: p.subtitle,
      category: p.category,
      vehicle: p.vehicle,
      apy: Number(p.apy),
      termDays: p.termDays,
      minAmount: p.minAmount,
      liquidity: p.liquidity,
      distribution: p.distribution,
      fundedPct: p.fundedPct,
      risk: p.risk,
      focus: p.focus,
      objective: p.objective,
      suitableFor: p.suitableFor,
      description: p.description,
    }))
  )
})

platform.get('/copy-allocations', requireUser, async (c) => {
  const rows = await c.var.db
    .select()
    .from(schema.userCopyAllocations)
    .where(eq(schema.userCopyAllocations.userId, c.var.user!.id))
  return c.json(
    rows.map((r) => ({
      traderId: r.traderId,
      amount: Number(r.amount),
      startedAt: r.startedAt,
      expiresAt: r.expiresAt,
      lifetimePnlUsd: Number(r.lifetimePnlUsd),
    }))
  )
})

platform.get('/bot-subscriptions', requireUser, async (c) => {
  const rows = await c.var.db
    .select()
    .from(schema.userBotSubscriptions)
    .where(eq(schema.userBotSubscriptions.userId, c.var.user!.id))
  return c.json(
    rows.map((r) => ({
      botId: r.botId,
      subscribedAt: r.subscribedAt,
      expiresAt: r.expiresAt,
      lifetimePnlUsd: Number(r.lifetimePnlUsd),
    }))
  )
})

platform.get('/following-traders', requireUser, async (c) => {
  const rows = await c.var.db
    .select()
    .from(schema.userFollowingTraders)
    .where(eq(schema.userFollowingTraders.userId, c.var.user!.id))
  return c.json(rows.map((r) => r.traderId))
})

platform.get('/investment-positions', requireUser, async (c) => {
  const rows = await c.var.db
    .select()
    .from(schema.userInvestmentPositions)
    .where(eq(schema.userInvestmentPositions.userId, c.var.user!.id))
  return c.json(
    rows.map((r) => ({
      productId: r.productId,
      amount: Number(r.amount),
      startedAt: r.startedAt,
    }))
  )
})

export { platform as platformRoutes }
