import { Hono } from 'hono'
import { and, eq, gt } from 'drizzle-orm'
import type { Env } from '../types/env'
import type { AppVariables } from '../types/env'
import { requireUser } from '../middleware/session'
import { trustedApiKey } from '../lib/api-auth'
import * as schema from '../db/schema'
import { provisionCoinForAllUsers } from '../services/wallet-provisioning'

const DEFAULT_SUB_DAYS = 30
const SUB_PERIOD_SEC = DEFAULT_SUB_DAYS * 86400

const platform = new Hono<{ Bindings: Env; Variables: AppVariables }>()

async function spendUserFiat(
  db: AppVariables['db'],
  userId: number,
  amount: number,
  note: string,
  methodName: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  const rows = await db
    .select()
    .from(schema.walletAssets)
    .where(and(eq(schema.walletAssets.userId, userId), eq(schema.walletAssets.assetType, 'fiat')))
    .limit(1)
  const fiat = rows[0]
  if (!fiat) return { ok: false, error: 'No fiat wallet' }
  const bal = Number(fiat.userBalance)
  if (!Number.isFinite(amount) || amount <= 0) return { ok: false, error: 'Invalid amount' }
  if (bal < amount) return { ok: false, error: 'Insufficient balance' }
  const next = (bal - amount).toFixed(8)
  await db.update(schema.walletAssets).set({ userBalance: next }).where(eq(schema.walletAssets.id, fiat.id))

  const tid = crypto.randomUUID()
  const now = Math.floor(Date.now() / 1000)
  await db.insert(schema.walletTransactions).values({
    id: tid,
    userId,
    type: 'withdrawal',
    amount: String(amount.toFixed(8)),
    eqAmount: String(amount.toFixed(8)),
    status: 'completed',
    createdAt: now,
    methodType: 'fiat',
    methodName,
    methodSymbol: fiat.coinShort,
    methodIcon: fiat.iconUrl ?? undefined,
    methodIconClass: fiat.iconClass ?? undefined,
    note,
  })
  return { ok: true }
}

platform.get('/coins', async (c) => {
  const rows = await c.var.db
    .select()
    .from(schema.coins)
    .where(eq(schema.coins.isActive, true))
  return c.json(
    rows.map((r) => ({
      id: r.id,
      name: r.name,
      symbol: r.symbol,
      chain: r.chain,
      confirmLevel: r.confirmLevel,
      iconUrl: r.iconUrl ?? undefined,
    }))
  )
})

/** Admin: add a new coin to the catalog and provision it for all existing users. */
platform.post('/coins', async (c) => {
  if (!trustedApiKey(c)) return c.json({ error: 'Forbidden' }, 403)

  const body = (await c.req.json().catch(() => ({}))) as {
    id?: string
    name?: string
    symbol?: string
    chain?: string
    confirmLevel?: number
    iconUrl?: string
  }

  const id = typeof body.id === 'string' ? body.id.trim().toUpperCase() : ''
  const name = typeof body.name === 'string' ? body.name.trim() : ''
  const symbol = typeof body.symbol === 'string' ? body.symbol.trim().toUpperCase() : ''
  const chain = typeof body.chain === 'string' ? body.chain.trim() : ''

  if (!id || !name || !symbol || !chain) {
    return c.json({ error: 'id, name, symbol and chain are required' }, 400)
  }

  // Upsert the coin (ignore if already exists so this endpoint is idempotent)
  await c.var.db
    .insert(schema.coins)
    .values({
      id,
      name,
      symbol,
      chain,
      confirmLevel: typeof body.confirmLevel === 'number' ? body.confirmLevel : 0,
      iconUrl: typeof body.iconUrl === 'string' ? body.iconUrl : null,
      isActive: true,
    })
    .onDuplicateKeyUpdate({
      set: {
        name,
        symbol,
        chain,
        isActive: true,
        ...(typeof body.iconUrl === 'string' ? { iconUrl: body.iconUrl } : {}),
      },
    })

  const provisioned = await provisionCoinForAllUsers(c.var.db, id)

  return c.json({ ok: true, coinId: id, usersProvisioned: provisioned })
})

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

platform.post('/bot-subscriptions', requireUser, async (c) => {
  const body = (await c.req.json().catch(() => ({}))) as { botId?: string }
  const botId = typeof body.botId === 'string' ? body.botId.trim() : ''
  if (!botId) return c.json({ error: 'botId required' }, 400)

  const uid = c.var.user!.id
  const now = Math.floor(Date.now() / 1000)

  const active = await c.var.db
    .select()
    .from(schema.userBotSubscriptions)
    .where(and(eq(schema.userBotSubscriptions.userId, uid), gt(schema.userBotSubscriptions.expiresAt, now)))

  if (active.length > 0) {
    if (active.some((s) => s.botId === botId)) {
      return c.json({ error: 'This bot already has an active subscription.' }, 409)
    }
    return c.json({ error: 'Another bot subscription is active. Cancel it before activating a new plan.' }, 409)
  }

  const [bot] = await c.var.db
    .select()
    .from(schema.tradingBots)
    .where(eq(schema.tradingBots.id, botId))
    .limit(1)
  if (!bot) return c.json({ error: 'Bot not found' }, 404)

  const price = Number(bot.priceUsd)
  const days = bot.subscriptionDays ?? DEFAULT_SUB_DAYS
  const periodSec = days * 86400

  const spend = await spendUserFiat(
    c.var.db,
    uid,
    price,
    `${bot.name} activation purchased from bot desk.`,
    'Bot Purchase'
  )
  if (!spend.ok) return c.json({ error: spend.error }, 400)

  await c.var.db.insert(schema.userBotSubscriptions).values({
    userId: uid,
    botId,
    subscribedAt: now,
    expiresAt: now + periodSec,
    lifetimePnlUsd: '0',
  })

  return c.json({
    ok: true,
    subscription: {
      botId,
      subscribedAt: now,
      expiresAt: now + periodSec,
      lifetimePnlUsd: 0,
    },
  })
})

platform.delete('/bot-subscriptions/:botId', requireUser, async (c) => {
  const botId = c.req.param('botId')
  const uid = c.var.user!.id
  const now = Math.floor(Date.now() / 1000)
  await c.var.db
    .delete(schema.userBotSubscriptions)
    .where(
      and(
        eq(schema.userBotSubscriptions.userId, uid),
        eq(schema.userBotSubscriptions.botId, botId),
        gt(schema.userBotSubscriptions.expiresAt, now)
      )
    )
  return c.json({ ok: true })
})

platform.post('/following-traders', requireUser, async (c) => {
  const body = (await c.req.json().catch(() => ({}))) as { traderId?: string; amount?: number }
  const traderId = typeof body.traderId === 'string' ? body.traderId.trim() : ''
  const amount = typeof body.amount === 'number' ? body.amount : Number(body.amount)
  if (!traderId) return c.json({ error: 'traderId required' }, 400)
  if (!Number.isFinite(amount) || amount <= 0) return c.json({ error: 'Invalid amount' }, 400)

  const [trader] = await c.var.db
    .select()
    .from(schema.copyTraders)
    .where(eq(schema.copyTraders.id, traderId))
    .limit(1)
  if (!trader) return c.json({ error: 'Trader not found' }, 404)
  if (amount < trader.minAllocation) {
    return c.json({ error: `Minimum allocation is ${trader.minAllocation}` }, 400)
  }

  const uid = c.var.user!.id
  const spend = await spendUserFiat(
    c.var.db,
    uid,
    amount,
    `${amount} USD allocated to ${trader.name}.`,
    'Copy Trading Allocation'
  )
  if (!spend.ok) return c.json({ error: spend.error }, 400)

  const now = Math.floor(Date.now() / 1000)
  const existing = await c.var.db
    .select()
    .from(schema.userCopyAllocations)
    .where(and(eq(schema.userCopyAllocations.userId, uid), eq(schema.userCopyAllocations.traderId, traderId)))
    .limit(1)

  if (existing[0]) {
    const ex = existing[0]
    const nextAmount = Number((Number(ex.amount) + amount).toFixed(2))
    const nextExpires = Math.max(now, ex.expiresAt) + SUB_PERIOD_SEC
    await c.var.db
      .update(schema.userCopyAllocations)
      .set({ amount: String(nextAmount), expiresAt: nextExpires })
      .where(eq(schema.userCopyAllocations.id, ex.id))
  } else {
    await c.var.db.insert(schema.userCopyAllocations).values({
      userId: uid,
      traderId,
      amount: String(amount.toFixed(8)),
      startedAt: now,
      expiresAt: now + SUB_PERIOD_SEC,
      lifetimePnlUsd: '0',
    })
  }

  const [alreadyFollowing] = await c.var.db
    .select()
    .from(schema.userFollowingTraders)
    .where(and(eq(schema.userFollowingTraders.userId, uid), eq(schema.userFollowingTraders.traderId, traderId)))
    .limit(1)
  if (!alreadyFollowing) {
    await c.var.db.insert(schema.userFollowingTraders).values({ userId: uid, traderId })
  }

  return c.json({ ok: true })
})

platform.post('/investment-positions', requireUser, async (c) => {
  const body = (await c.req.json().catch(() => ({}))) as { productId?: string; amount?: number }
  const productId = typeof body.productId === 'string' ? body.productId.trim() : ''
  const amount = typeof body.amount === 'number' ? body.amount : Number(body.amount)
  if (!productId) return c.json({ error: 'productId required' }, 400)
  if (!Number.isFinite(amount) || amount <= 0) return c.json({ error: 'Invalid amount' }, 400)

  const [product] = await c.var.db
    .select()
    .from(schema.investmentProducts)
    .where(eq(schema.investmentProducts.id, productId))
    .limit(1)
  if (!product) return c.json({ error: 'Product not found' }, 404)
  if (amount < product.minAmount) {
    return c.json({ error: `Minimum ticket is ${product.minAmount}` }, 400)
  }

  const uid = c.var.user!.id
  const spend = await spendUserFiat(
    c.var.db,
    uid,
    amount,
    `${amount} USD subscribed to ${product.name}.`,
    'Investment Subscription'
  )
  if (!spend.ok) return c.json({ error: spend.error }, 400)

  const now = Math.floor(Date.now() / 1000)
  const existing = await c.var.db
    .select()
    .from(schema.userInvestmentPositions)
    .where(and(eq(schema.userInvestmentPositions.userId, uid), eq(schema.userInvestmentPositions.productId, productId)))
    .limit(1)

  if (existing[0]) {
    const next = Number((Number(existing[0].amount) + amount).toFixed(2))
    await c.var.db
      .update(schema.userInvestmentPositions)
      .set({ amount: String(next) })
      .where(eq(schema.userInvestmentPositions.id, existing[0].id))
  } else {
    await c.var.db.insert(schema.userInvestmentPositions).values({
      userId: uid,
      productId,
      amount: String(amount.toFixed(8)),
      startedAt: now,
    })
  }

  return c.json({ ok: true })
})

export { platform as platformRoutes }
