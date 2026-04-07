import { Hono } from 'hono'
import { and, eq, asc, desc, like, or, sql, inArray } from 'drizzle-orm'
import type { Env } from '../types/env'
import type { AppVariables } from '../types/env'
import * as schema from '../db/schema'
import { requireAdmin } from '../middleware/admin'
import { getInternalUserIdByPublicId } from '../services/users-repo'
import { creditUserFiatUsd, spendUserFiatUsd } from '../lib/wallet-ledger'
import { mergeUserBiosFields, getUserBiosRow, biosSnapshotForApi } from '../lib/user-bios'
import { apiUserRow, fiatMetaForUser } from '../lib/api-user-response'
import { rowToTradePosition } from '../lib/trade-map'
import { fetchUsdSpots } from '../lib/cc-prices'
import { sendEmail } from '../email/resend-client'
import { adminWalletAdjustmentEmailHtml } from '../email/templates'
import { getTransactionalEmailBranding } from '../lib/email-branding'
import { registerAdminCatalogRoutes } from './admin-catalog'
import { registerAdminSettingsRoutes } from './admin-settings'
import { registerAdminFaqRoutes } from './admin-faq'
import { registerAdminVerificationQueueRoutes } from './admin-verification-queue'
import { registerAdminWalletPendingRoutes } from './admin-wallet-pending'
import { selectAllTradingBotsCatalog } from '../lib/trading-bots-query'

const admin = new Hono<{ Bindings: Env; Variables: AppVariables }>()

registerAdminCatalogRoutes(admin)
registerAdminSettingsRoutes(admin)
registerAdminFaqRoutes(admin)
registerAdminVerificationQueueRoutes(admin)
registerAdminWalletPendingRoutes(admin)

async function sendWalletAdjustNotifyEmail(
  env: Env,
  db: AppVariables['db'],
  internalUserId: number,
  params: {
    operation: 'credit' | 'debit'
    amountNative: string
    assetSymbol: string
    eqUsd: string
    note: string
    balanceAfter: string
  }
): Promise<boolean> {
  const [userRow] = await db
    .select({ email: schema.users.email })
    .from(schema.users)
    .where(eq(schema.users.id, internalUserId))
    .limit(1)
  if (!userRow?.email) return false
  const biosRow = await getUserBiosRow(db, internalUserId)
  const firstName = biosRow?.firstName?.trim() ?? ''
  const base = env.FRONTEND_URL?.trim() || 'http://localhost:4000'
  const branding = await getTransactionalEmailBranding(env, db)
  const tpl = adminWalletAdjustmentEmailHtml({
    firstName,
    operation: params.operation,
    amountNative: params.amountNative,
    assetSymbol: params.assetSymbol,
    eqUsd: params.eqUsd,
    note: params.note,
    balanceAfter: params.balanceAfter,
    dashboardUrl: base,
    ...branding,
  })
  const r = await sendEmail(env, userRow.email, tpl.subject, tpl.html)
  return r.ok
}

// ─── Admin stats ──────────────────────────────────────────────────────────────

admin.get('/stats', requireAdmin, async (c) => {
  const [userCount] = await c.var.db
    .select({ count: sql<number>`count(*)` })
    .from(schema.users)

  const [openTradeCount] = await c.var.db
    .select({ count: sql<number>`count(*)` })
    .from(schema.trades)
    .where(inArray(schema.trades.status, ['open', 'pending']))

  const [botCount] = await c.var.db
    .select({ count: sql<number>`count(*)` })
    .from(schema.tradingBots)

  const [activeBotSubCount] = await c.var.db
    .select({ count: sql<number>`count(*)` })
    .from(schema.userBotSubscriptions)
    .where(sql`expires_at > ${Math.floor(Date.now() / 1000)}`)

  return c.json({
    totalUsers: Number(userCount?.count ?? 0),
    openTrades: Number(openTradeCount?.count ?? 0),
    totalBots: Number(botCount?.count ?? 0),
    activeBotSubscriptions: Number(activeBotSubCount?.count ?? 0),
  })
})

// ─── User Management ──────────────────────────────────────────────────────────

/** GET /admin/users?page=1&limit=20&search=john */
admin.get('/users', requireAdmin, async (c) => {
  const page = Math.max(1, Number(c.req.query('page') ?? 1))
  const limit = Math.min(100, Math.max(1, Number(c.req.query('limit') ?? 20)))
  const search = (c.req.query('search') ?? '').trim()
  const offset = (page - 1) * limit

  const rows = search
    ? await c.var.db
        .select({
          publicId: schema.users.publicId,
          email: schema.users.email,
          verificationStatus: schema.users.verificationStatus,
          role: schema.users.role,
          createdAt: schema.users.createdAt,
          firstName: schema.userBios.firstName,
          lastName: schema.userBios.lastName,
        })
        .from(schema.users)
        .leftJoin(schema.userBios, eq(schema.userBios.userId, schema.users.id))
        .where(
          or(
            like(schema.users.email, `%${search}%`),
            like(schema.userBios.firstName, `%${search}%`),
            like(schema.userBios.lastName, `%${search}%`)
          )
        )
        .orderBy(desc(schema.users.createdAt))
        .limit(limit)
        .offset(offset)
    : await c.var.db
        .select({
          publicId: schema.users.publicId,
          email: schema.users.email,
          verificationStatus: schema.users.verificationStatus,
          role: schema.users.role,
          createdAt: schema.users.createdAt,
          firstName: schema.userBios.firstName,
          lastName: schema.userBios.lastName,
        })
        .from(schema.users)
        .leftJoin(schema.userBios, eq(schema.userBios.userId, schema.users.id))
        .orderBy(desc(schema.users.createdAt))
        .limit(limit)
        .offset(offset)

  const [countRow] = await c.var.db
    .select({ count: sql<number>`count(*)` })
    .from(schema.users)

  return c.json({
    data: rows.map((r) => ({
      id: r.publicId,
      email: r.email,
      firstName: r.firstName ?? '',
      lastName: r.lastName ?? '',
      verificationStatus: r.verificationStatus,
      role: r.role,
      createdAt: r.createdAt,
    })),
    total: Number(countRow?.count ?? 0),
    page,
    limit,
  })
})

/** GET /admin/users/fiat-usd-balances?ids=uuid,uuid — fiat wallet value in USD per user (for admin trade validation). */
admin.get('/users/fiat-usd-balances', requireAdmin, async (c) => {
  const raw = (c.req.query('ids') ?? '').trim()
  const publicIds = raw
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
    .slice(0, 100)

  if (publicIds.length === 0) return c.json({ balances: {} as Record<string, number> })

  const idMap = new Map<string, number>()
  for (const pid of publicIds) {
    const internalId = await getInternalUserIdByPublicId(c.var.db, pid)
    if (internalId != null) idMap.set(pid, internalId)
  }

  const internalIds = [...new Set(idMap.values())]
  if (internalIds.length === 0) return c.json({ balances: {} as Record<string, number> })

  const fiatRows = await c.var.db
    .select()
    .from(schema.walletAssets)
    .where(
      and(
        inArray(schema.walletAssets.userId, internalIds),
        eq(schema.walletAssets.assetType, 'fiat')
      )
    )

  const firstFiatByUser = new Map<number, (typeof fiatRows)[number]>()
  for (const row of fiatRows) {
    if (!firstFiatByUser.has(row.userId)) firstFiatByUser.set(row.userId, row)
  }

  const codes = new Set<string>()
  for (const row of firstFiatByUser.values()) {
    const code = (row.coinShort && row.coinShort.trim()) ? row.coinShort.trim().toUpperCase() : 'USD'
    if (code !== 'USD') codes.add(code)
  }
  const spots = await fetchUsdSpots(c.env, [...codes])

  const balances: Record<string, number> = {}
  for (const [publicId, userId] of idMap) {
    const row = firstFiatByUser.get(userId)
    if (!row) {
      balances[publicId] = 0
      continue
    }
    const code = (row.coinShort && row.coinShort.trim()) ? row.coinShort.trim().toUpperCase() : 'USD'
    const usdPerUnit =
      code === 'USD'
        ? 1
        : spots.get(code)?.usd ??
          (Number.isFinite(Number(row.price)) && Number(row.price) > 0 ? Number(row.price) : 1)
    const bal = Number(row.userBalance)
    balances[publicId] = Number.isFinite(bal) && Number.isFinite(usdPerUnit) ? bal * usdPerUnit : 0
  }

  return c.json({ balances })
})

/** GET /admin/users/:id — full user detail */
admin.get('/users/:id', requireAdmin, async (c) => {
  const publicId = c.req.param('id')
  const internalId = await getInternalUserIdByPublicId(c.var.db, publicId)
  if (internalId == null) return c.json({ error: 'Not found' }, 404)

  const [userRow] = await c.var.db
    .select()
    .from(schema.users)
    .where(eq(schema.users.id, internalId))
    .limit(1)
  if (!userRow) return c.json({ error: 'Not found' }, 404)

  const biosRow = await getUserBiosRow(c.var.db, internalId)
  const bios = biosSnapshotForApi(biosRow)
  const fiat = await fiatMetaForUser(c.var.db, userRow.currencyId)

  const assets = await c.var.db
    .select()
    .from(schema.walletAssets)
    .where(eq(schema.walletAssets.userId, internalId))

  const trades = await c.var.db
    .select()
    .from(schema.trades)
    .where(eq(schema.trades.userId, internalId))
    .orderBy(desc(schema.trades.entryTime))
    .limit(200)

  const botSubs = await c.var.db
    .select({
      sub: schema.userBotSubscriptions,
      bot: schema.tradingBots,
    })
    .from(schema.userBotSubscriptions)
    .leftJoin(schema.tradingBots, eq(schema.userBotSubscriptions.botId, schema.tradingBots.id))
    .where(eq(schema.userBotSubscriptions.userId, internalId))

  const copyAllocs = await c.var.db
    .select({
      alloc: schema.userCopyAllocations,
      trader: schema.copyTraders,
    })
    .from(schema.userCopyAllocations)
    .leftJoin(schema.copyTraders, eq(schema.userCopyAllocations.traderId, schema.copyTraders.id))
    .where(eq(schema.userCopyAllocations.userId, internalId))

  const investmentPositions = await c.var.db
    .select({
      pos: schema.userInvestmentPositions,
      product: schema.investmentProducts,
    })
    .from(schema.userInvestmentPositions)
    .leftJoin(
      schema.investmentProducts,
      eq(schema.userInvestmentPositions.productId, schema.investmentProducts.id)
    )
    .where(eq(schema.userInvestmentPositions.userId, internalId))

  return c.json({
    user: apiUserRow(
      {
        publicId: userRow.publicId,
        email: userRow.email,
        verificationStatus: userRow.verificationStatus,
        currencyId: userRow.currencyId,
        role: userRow.role,
        bios,
      },
      fiat
    ),
    bios,
    assets: assets.map((a) => ({
      id: a.id,
      coinId: a.coinId,
      coinName: a.coinName,
      coinShort: a.coinShort,
      userBalance: a.userBalance,
      assetType: a.assetType,
      price: a.price,
      walletId: a.walletId,
      iconUrl: a.iconUrl,
      iconClass: a.iconClass,
    })),
    trades: trades.map(rowToTradePosition),
    botSubscriptions: botSubs.map((r) => ({
      id: r.sub.id,
      botId: r.sub.botId,
      botName: r.bot?.name ?? '',
      subscribedAt: r.sub.subscribedAt,
      expiresAt: r.sub.expiresAt,
      lifetimePnlUsd: r.sub.lifetimePnlUsd,
    })),
    copyAllocations: copyAllocs.map((r) => ({
      id: r.alloc.id,
      traderId: r.alloc.traderId,
      traderName: r.trader?.name ?? '',
      amount: r.alloc.amount,
      startedAt: r.alloc.startedAt,
      expiresAt: r.alloc.expiresAt,
      lifetimePnlUsd: r.alloc.lifetimePnlUsd,
    })),
    investments: investmentPositions.map((r) => ({
      id: r.pos.id,
      productId: r.pos.productId,
      productName: r.product?.name ?? '',
      amount: r.pos.amount,
      startedAt: r.pos.startedAt,
      apy: r.product?.apy,
      termDays: r.product?.termDays,
    })),
  })
})

/** PATCH /admin/users/:id/bios */
admin.patch('/users/:id/bios', requireAdmin, async (c) => {
  const publicId = c.req.param('id')
  const internalId = await getInternalUserIdByPublicId(c.var.db, publicId)
  if (internalId == null) return c.json({ error: 'Not found' }, 404)

  const body = (await c.req.json().catch(() => ({}))) as Record<string, unknown>
  const patch: Record<string, unknown> = {}
  if (typeof body.firstName === 'string') patch.firstName = body.firstName
  if (typeof body.lastName === 'string') patch.lastName = body.lastName
  if (typeof body.phone === 'string') patch.phone = body.phone
  if (typeof body.country === 'string') patch.country = body.country

  await mergeUserBiosFields(c.var.db, internalId, patch)
  return c.json({ ok: true })
})

/** PATCH /admin/users/:id/verification */
admin.patch('/users/:id/verification', requireAdmin, async (c) => {
  const publicId = c.req.param('id')
  const internalId = await getInternalUserIdByPublicId(c.var.db, publicId)
  if (internalId == null) return c.json({ error: 'Not found' }, 404)

  const body = (await c.req.json().catch(() => ({}))) as Record<string, unknown>
  const status = Number(body.verificationStatus)
  if (!Number.isFinite(status) || status < 0 || status > 3) {
    return c.json({ error: 'verificationStatus must be 0–3' }, 400)
  }

  await c.var.db
    .update(schema.users)
    .set({ verificationStatus: status })
    .where(eq(schema.users.id, internalId))

  return c.json({ ok: true })
})

/** PATCH /admin/users/:id/role */
admin.patch('/users/:id/role', requireAdmin, async (c) => {
  const publicId = c.req.param('id')
  const internalId = await getInternalUserIdByPublicId(c.var.db, publicId)
  if (internalId == null) return c.json({ error: 'Not found' }, 404)

  const body = (await c.req.json().catch(() => ({}))) as Record<string, unknown>
  const role = String(body.role ?? 'user')
  if (!['user', 'admin'].includes(role)) {
    return c.json({ error: 'role must be user or admin' }, 400)
  }

  await c.var.db
    .update(schema.users)
    .set({ role })
    .where(eq(schema.users.id, internalId))

  return c.json({ ok: true })
})

// ─── Wallet / Funding ─────────────────────────────────────────────────────────

/** POST /admin/users/:id/fund-fiat */
admin.post('/users/:id/fund-fiat', requireAdmin, async (c) => {
  const publicId = c.req.param('id')
  const internalId = await getInternalUserIdByPublicId(c.var.db, publicId)
  if (internalId == null) return c.json({ error: 'Not found' }, 404)

  const body = (await c.req.json().catch(() => ({}))) as Record<string, unknown>
  const amountUsd = Number(body.amountUsd)
  const operation = String(body.operation ?? 'credit')
  const note =
    typeof body.note === 'string' && body.note.trim() ? body.note.trim() : 'Admin adjustment'

  if (!Number.isFinite(amountUsd) || amountUsd <= 0) {
    return c.json({ error: 'amountUsd must be a positive number' }, 400)
  }
  if (!['credit', 'debit'].includes(operation)) {
    return c.json({ error: 'operation must be credit or debit' }, 400)
  }

  const result =
    operation === 'credit'
      ? await creditUserFiatUsd(c.env, c.var.db, internalId, amountUsd, note, 'Admin funding')
      : await spendUserFiatUsd(c.env, c.var.db, internalId, amountUsd, note, 'Admin deduction')

  if (!result.ok) return c.json({ error: result.error }, 400)
  return c.json({ ok: true })
})

/** POST /admin/users/:id/fund-asset */
admin.post('/users/:id/fund-asset', requireAdmin, async (c) => {
  const publicId = c.req.param('id')
  const internalId = await getInternalUserIdByPublicId(c.var.db, publicId)
  if (internalId == null) return c.json({ error: 'Not found' }, 404)

  const body = (await c.req.json().catch(() => ({}))) as Record<string, unknown>
  const assetId = Number(body.assetId)
  const newBalance = Number(body.newBalance)

  if (!Number.isFinite(assetId) || assetId <= 0) {
    return c.json({ error: 'assetId required' }, 400)
  }
  if (!Number.isFinite(newBalance) || newBalance < 0) {
    return c.json({ error: 'newBalance must be >= 0' }, 400)
  }

  const [asset] = await c.var.db
    .select()
    .from(schema.walletAssets)
    .where(eq(schema.walletAssets.id, assetId))
    .limit(1)

  if (!asset || asset.userId !== internalId) {
    return c.json({ error: 'Asset not found for this user' }, 404)
  }

  await c.var.db
    .update(schema.walletAssets)
    .set({ userBalance: String(newBalance.toFixed(8)) })
    .where(eq(schema.walletAssets.id, assetId))

  const tid = crypto.randomUUID()
  const now = Math.floor(Date.now() / 1000)
  const prev = Number(asset.userBalance)
  const delta = newBalance - prev
  await c.var.db.insert(schema.walletTransactions).values({
    id: tid,
    userId: internalId,
    type: delta >= 0 ? 'deposit' : 'withdrawal',
    amount: String(Math.abs(delta).toFixed(8)),
    eqAmount: String(Math.abs(delta).toFixed(8)),
    status: 'completed',
    createdAt: now,
    methodType: asset.assetType === 'fiat' ? 'fiat' : 'crypto',
    methodName: 'Admin balance adjustment',
    methodSymbol: asset.coinShort,
    methodIcon: asset.iconUrl ?? undefined,
    note: `Admin set balance to ${newBalance}`,
  })

  return c.json({ ok: true })
})

/**
 * POST /admin/users/:id/wallet-adjust
 * Credit or debit a specific wallet asset by amount in native units; writes wallet_transactions + optional user email.
 */
admin.post('/users/:id/wallet-adjust', requireAdmin, async (c) => {
  const publicId = c.req.param('id')
  const internalId = await getInternalUserIdByPublicId(c.var.db, publicId)
  if (internalId == null) return c.json({ error: 'Not found' }, 404)

  const body = (await c.req.json().catch(() => ({}))) as Record<string, unknown>
  const assetId = Number(body.assetId)
  const operation = String(body.operation ?? '')
  const amountRaw = Number(body.amount)
  const note =
    typeof body.note === 'string' && body.note.trim() ? body.note.trim() : 'Admin adjustment'
  const notifyUser = Boolean(body.notifyUser)

  if (!Number.isFinite(assetId) || assetId <= 0) {
    return c.json({ error: 'assetId required' }, 400)
  }
  if (!['credit', 'debit'].includes(operation)) {
    return c.json({ error: 'operation must be credit or debit' }, 400)
  }
  if (!Number.isFinite(amountRaw) || amountRaw <= 0) {
    return c.json({ error: 'amount must be a positive number' }, 400)
  }

  const [asset] = await c.var.db
    .select()
    .from(schema.walletAssets)
    .where(eq(schema.walletAssets.id, assetId))
    .limit(1)

  if (!asset || asset.userId !== internalId) {
    return c.json({ error: 'Asset not found for this user' }, 404)
  }

  const prec = asset.assetType === 'fiat' ? 2 : 8
  const amt = Number(amountRaw.toFixed(prec))
  if (!Number.isFinite(amt) || amt <= 0) {
    return c.json({ error: 'Invalid amount after rounding' }, 400)
  }

  const prev = Number(asset.userBalance)
  const delta = operation === 'credit' ? amt : -amt
  const next = prev + delta
  if (next < -1e-12) {
    return c.json({ error: 'Insufficient balance for this debit' }, 400)
  }

  const sym = (asset.coinShort && asset.coinShort.trim()) ? asset.coinShort.trim().toUpperCase() : 'USD'
  const spots = await fetchUsdSpots(c.env, [sym])
  let unitUsd = spots.get(sym)?.usd ?? 0
  if (!(unitUsd > 0)) {
    const fallback = Number(asset.price)
    unitUsd = Number.isFinite(fallback) && fallback > 0 ? fallback : sym === 'USD' ? 1 : 0
  }
  const eqUsd = Math.abs(amt * unitUsd)

  const nextStr = next.toFixed(8)
  await c.var.db
    .update(schema.walletAssets)
    .set({ userBalance: nextStr })
    .where(eq(schema.walletAssets.id, assetId))

  const tid = crypto.randomUUID()
  const now = Math.floor(Date.now() / 1000)
  await c.var.db.insert(schema.walletTransactions).values({
    id: tid,
    userId: internalId,
    type: delta >= 0 ? 'deposit' : 'withdrawal',
    amount: String(Math.abs(amt).toFixed(8)),
    eqAmount: String(eqUsd.toFixed(8)),
    status: 'completed',
    createdAt: now,
    methodType: asset.assetType === 'fiat' ? 'fiat' : 'crypto',
    methodName: operation === 'credit' ? 'Admin funding' : 'Admin deduction',
    methodSymbol: asset.coinShort,
    methodIcon: asset.iconUrl ?? undefined,
    methodIconClass: asset.iconClass ?? undefined,
    note,
  })

  let emailSent = false
  if (notifyUser) {
    emailSent = await sendWalletAdjustNotifyEmail(c.env, c.var.db, internalId, {
      operation: operation as 'credit' | 'debit',
      amountNative: amt.toFixed(prec).replace(/\.?0+$/, '') || String(amt),
      assetSymbol: sym,
      eqUsd: eqUsd.toFixed(2),
      note,
      balanceAfter: Number(nextStr).toLocaleString('en-US', {
        maximumFractionDigits: prec,
      }),
    })
  }

  return c.json({ ok: true, emailSent })
})

// ─── Manual Trade Creation ────────────────────────────────────────────────────

/** GET /admin/trades */
admin.get('/trades', requireAdmin, async (c) => {
  const page = Math.max(1, Number(c.req.query('page') ?? 1))
  const limit = Math.min(100, Math.max(1, Number(c.req.query('limit') ?? 50)))
  const offset = (page - 1) * limit
  const statusFilter = c.req.query('status') as
    | 'open'
    | 'completed'
    | 'pending'
    | 'canceled'
    | 'failed'
    | undefined
  const userPublicId = c.req.query('userId')

  let internalUserId: number | null = null
  if (userPublicId) {
    internalUserId = await getInternalUserIdByPublicId(c.var.db, userPublicId)
  }

  let rows
  if (internalUserId != null && statusFilter) {
    rows = await c.var.db
      .select()
      .from(schema.trades)
      .where(
        sql`${schema.trades.userId} = ${internalUserId} AND ${schema.trades.status} = ${statusFilter}`
      )
      .orderBy(desc(schema.trades.entryTime))
      .limit(limit)
      .offset(offset)
  } else if (internalUserId != null) {
    rows = await c.var.db
      .select()
      .from(schema.trades)
      .where(eq(schema.trades.userId, internalUserId))
      .orderBy(desc(schema.trades.entryTime))
      .limit(limit)
      .offset(offset)
  } else if (statusFilter) {
    rows = await c.var.db
      .select()
      .from(schema.trades)
      .where(eq(schema.trades.status, statusFilter))
      .orderBy(desc(schema.trades.entryTime))
      .limit(limit)
      .offset(offset)
  } else {
    rows = await c.var.db
      .select()
      .from(schema.trades)
      .orderBy(desc(schema.trades.entryTime))
      .limit(limit)
      .offset(offset)
  }

  const userIds = [...new Set(rows.map((r) => r.userId))]
  const userRows =
    userIds.length > 0
      ? await c.var.db
          .select({
            id: schema.users.id,
            publicId: schema.users.publicId,
            email: schema.users.email,
          })
          .from(schema.users)
          .where(inArray(schema.users.id, userIds))
      : []
  const userMap = new Map(userRows.map((u) => [u.id, { publicId: u.publicId, email: u.email }]))

  return c.json({
    data: rows.map((t) => ({
      ...rowToTradePosition(t),
      userId: userMap.get(t.userId)?.publicId ?? '',
      userEmail: userMap.get(t.userId)?.email ?? '',
    })),
    page,
    limit,
  })
})

/** POST /admin/trades/create */
admin.post('/trades/create', requireAdmin, async (c) => {
  const body = (await c.req.json().catch(() => ({}))) as Record<string, unknown>

  const userIds = Array.isArray(body.userIds) ? (body.userIds as string[]) : []
  if (userIds.length === 0) return c.json({ error: 'userIds required' }, 400)

  const outcome = String(body.outcome ?? '')
  if (!['win', 'loss'].includes(outcome)) {
    return c.json({ error: 'outcome must be win or loss' }, 400)
  }

  const assetType = String(body.assetType ?? '')
  if (!['crypto', 'stock', 'forex', 'commodity'].includes(assetType)) {
    return c.json({ error: 'assetType must be crypto, stock, forex, or commodity' }, 400)
  }

  const day = new Date().getUTCDay()
  const isWeekend = day === 0 || day === 6
  if (isWeekend && assetType !== 'crypto') {
    return c.json({ error: 'Only crypto trades are available on weekends' }, 400)
  }

  const pair = String(body.pair ?? '').trim()
  if (!pair) return c.json({ error: 'pair required' }, 400)

  const entryPrice = Number(body.entryPrice)
  const amount = Number(body.amount)
  const estimatedProfit = Number(body.estimatedProfit)
  const leverage = Number(body.leverage ?? 1) || 1

  if (!(entryPrice > 0)) return c.json({ error: 'entryPrice required' }, 400)
  if (!(amount > 0)) return c.json({ error: 'amount required' }, 400)
  if (!Number.isFinite(estimatedProfit)) return c.json({ error: 'estimatedProfit required' }, 400)
  if (outcome === 'win' && estimatedProfit <= 0) {
    return c.json({ error: 'Win trades require estimated profit greater than zero' }, 400)
  }

  const signedProfit = outcome === 'win' ? Math.abs(estimatedProfit) : -Math.abs(estimatedProfit)
  const pnlRatio = amount > 0 ? signedProfit / amount : 0
  const closingPrice =
    Number(body.closingPrice) > 0
      ? Number(body.closingPrice)
      : entryPrice * (1 + pnlRatio / Math.max(leverage, 1))

  const pairNorm = pair.replace(/\//g, '-').replace(/\s+/g, '').toUpperCase()
  const [basePart, quotePart] = pairNorm.split('-')
  const base = basePart?.trim() || pairNorm
  const quote = quotePart?.trim() || 'USD'

  const directionRaw = String(body.direction ?? 'long').toLowerCase()
  const direction: 'long' | 'short' = directionRaw === 'short' ? 'short' : 'long'
  const option: 'buy' | 'sell' = direction === 'long' ? 'buy' : 'sell'

  const DEFAULT_TP = 0.02
  const DEFAULT_SL = 0.01
  let slVal =
    direction === 'long' ? entryPrice * (1 - DEFAULT_SL) : entryPrice * (1 + DEFAULT_SL)
  let tpVal =
    direction === 'long' ? entryPrice * (1 + DEFAULT_TP) : entryPrice * (1 - DEFAULT_TP)
  const tpOverride = Number(body.takeProfitPrice)
  const slOverride = Number(body.stopLossPrice)
  if (Number.isFinite(tpOverride) && tpOverride > 0) tpVal = tpOverride
  if (Number.isFinite(slOverride) && slOverride > 0) slVal = slOverride

  const levN = Math.max(1, leverage)
  const notionalUsd = amount * levN
  const baseAmount = entryPrice > 0 ? notionalUsd / entryPrice : 0

  const now = Math.floor(Date.now() / 1000)
  const maxPast = now - Math.floor(10 * 365.25 * 86400)

  let entryTime = Number(body.entryTime)
  if (!Number.isFinite(entryTime) || entryTime <= 0) {
    entryTime = now - 3600
  }
  entryTime = Math.floor(entryTime)
  if (entryTime < maxPast) {
    return c.json({ error: 'entryTime is too far in the past' }, 400)
  }
  if (entryTime > now + 120) {
    return c.json({ error: 'entryTime cannot be in the future' }, 400)
  }

  let durationSeconds = Number(body.durationSeconds)
  if (!Number.isFinite(durationSeconds)) {
    durationSeconds = 3600
  }
  durationSeconds = Math.floor(durationSeconds)
  if (durationSeconds < 60) {
    return c.json({ error: 'durationSeconds must be at least 60 (1 minute)' }, 400)
  }
  if (durationSeconds > 366 * 86400) {
    return c.json({ error: 'durationSeconds exceeds maximum (366 days)' }, 400)
  }

  const closingTime = entryTime + durationSeconds
  if (closingTime <= entryTime) {
    return c.json({ error: 'Invalid entry time or duration' }, 400)
  }
  if (closingTime > now + 120) {
    return c.json({ error: 'Closing time cannot be in the future' }, 400)
  }

  const createdTrades: string[] = []
  const errors: { userId: string; error: string }[] = []

  for (const publicId of userIds) {
    const internalId = await getInternalUserIdByPublicId(c.var.db, publicId)
    if (internalId == null) {
      errors.push({ userId: publicId, error: 'User not found' })
      continue
    }

    const tradeId = crypto.randomUUID()
    const pnl = signedProfit
    const roiPct = amount > 0 ? (pnl / amount) * 100 : 0
    const fees = amount * 0.001

    const liqApprox =
      direction === 'long'
        ? entryPrice * Math.max(0.05, 1 - 0.95 / levN)
        : entryPrice * (1 + 0.95 / levN)

    try {
      await c.var.db.transaction(async (tx) => {
        await tx.insert(schema.liveOrders).values({
          id: tradeId,
          userId: internalId,
          pair: pairNorm,
          side: option,
          orderType: 'market',
          amount: String(Number(baseAmount.toFixed(8))),
          leverage,
          price: String(entryPrice),
          marginType: 'isolated',
          status: 'filled',
          createdAt: entryTime,
        })
        await tx.insert(schema.trades).values({
          id: tradeId,
          userId: internalId,
          pair: pairNorm,
          base,
          quote,
          option,
          direction,
          entryTime,
          entryPrice: String(entryPrice),
          invested: String(amount),
          currency: 'USD',
          closingTime,
          closingPrice: String(closingPrice),
          status: 'completed',
          roi: String(roiPct.toFixed(4)),
          leverage,
          size: String(amount * leverage),
          margin: String(amount),
          marginPercentage: String((1 / leverage) * 100),
          marginType: 'isolated',
          pnl: String(pnl),
          sl: String(slVal),
          tp: String(tpVal),
          fees: String(fees),
          liquidationPrice: String(liqApprox),
          marketPrice: String(closingPrice),
          strategy: assetType,
          confidence: 85,
          riskReward: '2:1',
          note: `Admin-created ${outcome} trade (${direction})`,
          setup: `${assetType.charAt(0).toUpperCase() + assetType.slice(1)} ${pairNorm}`,
          fundedWith: 'fiat',
          executionVenue: 'auto',
          tags: [assetType, outcome, direction],
        })
      })
    } catch {
      errors.push({ userId: publicId, error: 'Failed to record trade' })
      continue
    }

    if (pnl > 0) {
      await creditUserFiatUsd(
        c.env,
        c.var.db,
        internalId,
        pnl,
        `Trade P&L: ${pair} win (~${pnl.toFixed(2)} USD)`,
        'Trade settlement'
      )
    } else if (pnl < 0) {
      await spendUserFiatUsd(
        c.env,
        c.var.db,
        internalId,
        Math.abs(pnl),
        `Trade P&L: ${pair} loss (~${Math.abs(pnl).toFixed(2)} USD)`,
        'Trade settlement'
      ).catch(() => null)
    }

    createdTrades.push(tradeId)
  }

  return c.json({ ok: true, created: createdTrades.length, errors })
})

// ─── Bot Catalog Management ───────────────────────────────────────────────────

admin.get('/bots', requireAdmin, async (c) => {
  const rows = await selectAllTradingBotsCatalog(c.var.db)
  return c.json({ data: rows })
})

admin.post('/bots', requireAdmin, async (c) => {
  const body = (await c.req.json().catch(() => ({}))) as Record<string, unknown>
  const id =
    typeof body.id === 'string' && body.id.trim() ? body.id.trim() : crypto.randomUUID()

  if (!body.name || !body.strategy) {
    return c.json({ error: 'name and strategy required' }, 400)
  }

  await c.var.db.insert(schema.tradingBots).values({
    id,
    name: String(body.name),
    strapline: String(body.strapline ?? ''),
    description: String(body.description ?? ''),
    strategy: String(body.strategy),
    priceUsd: String(Number(body.priceUsd ?? 0).toFixed(2)),
    monthlyTarget: String(body.monthlyTarget ?? ''),
    winRate: Number(body.winRate ?? 0),
    maxDrawdown: Number(body.maxDrawdown ?? 0),
    markets: Array.isArray(body.markets) ? (body.markets as string[]) : [],
    cadence: String(body.cadence ?? 'daily'),
    guardrails: Array.isArray(body.guardrails) ? (body.guardrails as string[]) : [],
    subscriptionDays: Number(body.subscriptionDays ?? 30),
    maxTradesPerDay: Number(body.maxTradesPerDay ?? 4),
    tradeSizePctOfFiatBalance: String(Number(body.tradeSizePctOfFiatBalance ?? 0.05).toFixed(6)),
    minTradeSizeUsd: String(Number(body.minTradeSizeUsd ?? 10).toFixed(2)),
    maxTradeSizeUsd: String(Number(body.maxTradeSizeUsd ?? 500).toFixed(2)),
  })

  return c.json({ ok: true, id })
})

admin.patch('/bots/:id', requireAdmin, async (c) => {
  const id = c.req.param('id')
  const body = (await c.req.json().catch(() => ({}))) as Record<string, unknown>

  const upd: Record<string, unknown> = {}
  if (typeof body.name === 'string') upd.name = body.name
  if (typeof body.strapline === 'string') upd.strapline = body.strapline
  if (typeof body.description === 'string') upd.description = body.description
  if (typeof body.strategy === 'string') upd.strategy = body.strategy
  if (body.priceUsd !== undefined) upd.priceUsd = String(Number(body.priceUsd).toFixed(2))
  if (typeof body.monthlyTarget === 'string') upd.monthlyTarget = body.monthlyTarget
  if (body.winRate !== undefined) upd.winRate = Number(body.winRate)
  if (body.maxDrawdown !== undefined) upd.maxDrawdown = Number(body.maxDrawdown)
  if (Array.isArray(body.markets)) upd.markets = body.markets
  if (typeof body.cadence === 'string') upd.cadence = body.cadence
  if (Array.isArray(body.guardrails)) upd.guardrails = body.guardrails
  if (body.subscriptionDays !== undefined) upd.subscriptionDays = Number(body.subscriptionDays)
  if (body.maxTradesPerDay !== undefined) upd.maxTradesPerDay = Number(body.maxTradesPerDay)
  if (body.tradeSizePctOfFiatBalance !== undefined) {
    upd.tradeSizePctOfFiatBalance = String(Number(body.tradeSizePctOfFiatBalance).toFixed(6))
  }
  if (body.minTradeSizeUsd !== undefined) {
    upd.minTradeSizeUsd = String(Number(body.minTradeSizeUsd).toFixed(2))
  }
  if (body.maxTradeSizeUsd !== undefined) {
    upd.maxTradeSizeUsd = String(Number(body.maxTradeSizeUsd).toFixed(2))
  }

  if (Object.keys(upd).length === 0) return c.json({ error: 'Nothing to update' }, 400)
  await c.var.db.update(schema.tradingBots).set(upd).where(eq(schema.tradingBots.id, id))
  return c.json({ ok: true })
})

admin.delete('/bots/:id', requireAdmin, async (c) => {
  await c.var.db.delete(schema.tradingBots).where(eq(schema.tradingBots.id, c.req.param('id')))
  return c.json({ ok: true })
})

// ─── Copy Trader Catalog Management ──────────────────────────────────────────

admin.get('/copy-traders', requireAdmin, async (c) => {
  const rows = await c.var.db.select().from(schema.copyTraders)
  return c.json({ data: rows })
})

admin.post('/copy-traders', requireAdmin, async (c) => {
  const body = (await c.req.json().catch(() => ({}))) as Record<string, unknown>
  const id =
    typeof body.id === 'string' && body.id.trim() ? body.id.trim() : crypto.randomUUID()

  if (!body.name || !body.handle) {
    return c.json({ error: 'name and handle required' }, 400)
  }
  const capacity = String(body.capacity ?? 'Open')
  if (!['Open', 'Limited'].includes(capacity)) {
    return c.json({ error: 'capacity must be Open or Limited' }, 400)
  }

  await c.var.db.insert(schema.copyTraders).values({
    id,
    name: String(body.name),
    handle: String(body.handle),
    specialty: String(body.specialty ?? ''),
    followers: Number(body.followers ?? 0),
    winRate: Number(body.winRate ?? 0),
    maxDrawdown: Number(body.maxDrawdown ?? 0),
    minAllocation: Number(body.minAllocation ?? 0),
    feePct: Number(body.feePct ?? 0),
    monthlyReturn: String(body.monthlyReturn ?? ''),
    bio: String(body.bio ?? ''),
    focusPairs: Array.isArray(body.focusPairs) ? (body.focusPairs as string[]) : [],
    capacity: capacity as 'Open' | 'Limited',
  })

  return c.json({ ok: true, id })
})

admin.patch('/copy-traders/:id', requireAdmin, async (c) => {
  const id = c.req.param('id')
  const body = (await c.req.json().catch(() => ({}))) as Record<string, unknown>

  const upd: Record<string, unknown> = {}
  if (typeof body.name === 'string') upd.name = body.name
  if (typeof body.handle === 'string') upd.handle = body.handle
  if (typeof body.specialty === 'string') upd.specialty = body.specialty
  if (body.followers !== undefined) upd.followers = Number(body.followers)
  if (body.winRate !== undefined) upd.winRate = Number(body.winRate)
  if (body.maxDrawdown !== undefined) upd.maxDrawdown = Number(body.maxDrawdown)
  if (body.minAllocation !== undefined) upd.minAllocation = Number(body.minAllocation)
  if (body.feePct !== undefined) upd.feePct = Number(body.feePct)
  if (typeof body.monthlyReturn === 'string') upd.monthlyReturn = body.monthlyReturn
  if (typeof body.bio === 'string') upd.bio = body.bio
  if (Array.isArray(body.focusPairs)) upd.focusPairs = body.focusPairs
  if (body.capacity !== undefined && ['Open', 'Limited'].includes(String(body.capacity))) {
    upd.capacity = body.capacity
  }

  if (Object.keys(upd).length === 0) return c.json({ error: 'Nothing to update' }, 400)
  await c.var.db.update(schema.copyTraders).set(upd).where(eq(schema.copyTraders.id, id))
  return c.json({ ok: true })
})

admin.delete('/copy-traders/:id', requireAdmin, async (c) => {
  await c.var.db.delete(schema.copyTraders).where(eq(schema.copyTraders.id, c.req.param('id')))
  return c.json({ ok: true })
})

// ─── Investment Product Management ───────────────────────────────────────────

admin.get('/investments', requireAdmin, async (c) => {
  const rows = await c.var.db.select().from(schema.investmentProducts)
  return c.json({ data: rows })
})

admin.post('/investments', requireAdmin, async (c) => {
  const body = (await c.req.json().catch(() => ({}))) as Record<string, unknown>
  const id =
    typeof body.id === 'string' && body.id.trim() ? body.id.trim() : crypto.randomUUID()

  if (!body.name) return c.json({ error: 'name required' }, 400)
  const category = String(body.category ?? 'Short Term')
  if (!['Short Term', 'Long Term', 'Retirement'].includes(category)) {
    return c.json({ error: 'category must be Short Term, Long Term, or Retirement' }, 400)
  }
  const risk = String(body.risk ?? 'Low')
  if (!['Low', 'Moderate', 'High'].includes(risk)) {
    return c.json({ error: 'risk must be Low, Moderate, or High' }, 400)
  }

  await c.var.db.insert(schema.investmentProducts).values({
    id,
    name: String(body.name),
    subtitle: String(body.subtitle ?? ''),
    category: category as 'Short Term' | 'Long Term' | 'Retirement',
    vehicle: String(body.vehicle ?? ''),
    apy: String(Number(body.apy ?? 0).toFixed(4)),
    termDays: Number(body.termDays ?? 30),
    minAmount: Number(body.minAmount ?? 100),
    liquidity: String(body.liquidity ?? 'Low'),
    distribution: String(body.distribution ?? 'Monthly'),
    fundedPct: Number(body.fundedPct ?? 0),
    risk: risk as 'Low' | 'Moderate' | 'High',
    focus: Array.isArray(body.focus) ? (body.focus as string[]) : [],
    objective: String(body.objective ?? ''),
    suitableFor: String(body.suitableFor ?? ''),
    description: String(body.description ?? ''),
  })

  return c.json({ ok: true, id })
})

admin.patch('/investments/:id', requireAdmin, async (c) => {
  const id = c.req.param('id')
  const body = (await c.req.json().catch(() => ({}))) as Record<string, unknown>

  const upd: Record<string, unknown> = {}
  if (typeof body.name === 'string') upd.name = body.name
  if (typeof body.subtitle === 'string') upd.subtitle = body.subtitle
  if (
    body.category !== undefined &&
    ['Short Term', 'Long Term', 'Retirement'].includes(String(body.category))
  ) {
    upd.category = body.category
  }
  if (typeof body.vehicle === 'string') upd.vehicle = body.vehicle
  if (body.apy !== undefined) upd.apy = String(Number(body.apy).toFixed(4))
  if (body.termDays !== undefined) upd.termDays = Number(body.termDays)
  if (body.minAmount !== undefined) upd.minAmount = Number(body.minAmount)
  if (typeof body.liquidity === 'string') upd.liquidity = body.liquidity
  if (typeof body.distribution === 'string') upd.distribution = body.distribution
  if (body.fundedPct !== undefined) upd.fundedPct = Number(body.fundedPct)
  if (body.risk !== undefined && ['Low', 'Moderate', 'High'].includes(String(body.risk))) {
    upd.risk = body.risk
  }
  if (Array.isArray(body.focus)) upd.focus = body.focus
  if (typeof body.objective === 'string') upd.objective = body.objective
  if (typeof body.suitableFor === 'string') upd.suitableFor = body.suitableFor
  if (typeof body.description === 'string') upd.description = body.description

  if (Object.keys(upd).length === 0) return c.json({ error: 'Nothing to update' }, 400)
  await c.var.db
    .update(schema.investmentProducts)
    .set(upd)
    .where(eq(schema.investmentProducts.id, id))
  return c.json({ ok: true })
})

admin.delete('/investments/:id', requireAdmin, async (c) => {
  await c.var.db
    .delete(schema.investmentProducts)
    .where(eq(schema.investmentProducts.id, c.req.param('id')))
  return c.json({ ok: true })
})

export { admin as adminRoutes }
