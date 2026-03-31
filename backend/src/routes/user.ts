import { Hono } from 'hono'
import { eq, and, inArray, desc } from 'drizzle-orm'
import type { InferSelectModel } from 'drizzle-orm'
import {
  loginBodySchema,
  userIdBodySchema,
  closeTradeBodySchema,
  currencyIdBodySchema,
  getVerificationStatusBodySchema,
  updateUserStatusBodySchema,
  updateCurrencyBodySchema,
  addAdminWalletBodySchema,
} from '@trading-dash/shared'
import type { Env } from '../types/env'
import type { AppVariables } from '../types/env'
import { requireUser } from '../middleware/session'
import { assertUserScope, trustedApiKey } from '../lib/api-auth'
import { sendEmail } from '../email/resend-client'
import { onboardingWelcomeEmailHtml } from '../email/templates'
import { hashPassword, verifyPassword } from '../lib/password'
import { randomSessionId } from '../lib/otp'
import * as schema from '../db/schema'
import { rowToTradePosition } from '../lib/trade-map'
import { getInternalUserIdByPublicId } from '../services/users-repo'
import { provisionUserWallets } from '../services/wallet-provisioning'

type ActivityLogRow = InferSelectModel<typeof schema.activityLogs>
type TradeRow = InferSelectModel<typeof schema.trades>
type FiatRow = InferSelectModel<typeof schema.fiatCurrencies>

const user = new Hono<{ Bindings: Env; Variables: AppVariables }>()

function apiUserRow(u: {
  publicId: string
  email: string
  verificationStatus: number
  currencyId: number | null
  bios?: unknown
}) {
  const b =
    u.bios && typeof u.bios === 'object' && !Array.isArray(u.bios)
      ? (u.bios as Record<string, unknown>)
      : {}
  // phone may be stored as "phone" or "phoneNumber" depending on onboarding step
  const phone =
    typeof b.phone === 'string' && b.phone.trim()
      ? b.phone.trim()
      : typeof b.phoneNumber === 'string' && b.phoneNumber.trim()
        ? b.phoneNumber.trim()
        : ''
  return {
    user_id: u.publicId,
    email: u.email,
    verificationStatus: String(u.verificationStatus) as '0' | '1' | '2' | '3',
    currency_id: u.currencyId ?? '',
    firstName: typeof b.firstName === 'string' ? b.firstName : '',
    lastName: typeof b.lastName === 'string' ? b.lastName : '',
    phone,
    country: typeof b.country === 'string' ? b.country : '',
    loginOtpEnabled: b.loginOtpEnabled === true,
  }
}

user.get('/me', requireUser, async (c) => {
  const uid = c.var.user!.id
  const [row] = await c.var.db.select().from(schema.users).where(eq(schema.users.id, uid)).limit(1)
  if (!row) return c.json({ error: 'Not found' }, 404)
  const bios =
    row.bios && typeof row.bios === 'object' && !Array.isArray(row.bios)
      ? (row.bios as Record<string, unknown>)
      : {}
  return c.json({
    user: apiUserRow({
      publicId: row.publicId,
      email: row.email,
      verificationStatus: row.verificationStatus,
      currencyId: row.currencyId,
      bios: row.bios,
    }),
    bios,
  })
})

user.post('/login', async (c) => {
  const parsed = loginBodySchema.safeParse(await c.req.json().catch(() => ({})))
  if (!parsed.success) return c.json({ error: 'Invalid body' }, 400)
  const { useremail, password } = parsed.data

  const rows = await c.var.db
    .select()
    .from(schema.users)
    .where(eq(schema.users.email, useremail))
    .limit(1)
  const u = rows[0]
  if (!u?.passwordHash || !(await verifyPassword(password, u.passwordHash))) {
    return c.json({ error: 'Invalid credentials' }, 401)
  }

  const bearer = randomSessionId()
  const now = Math.floor(Date.now() / 1000)
  const week = 60 * 60 * 24 * 7
  await c.var.db.insert(schema.authTokens).values({
    userId: u.id,
    token: bearer,
    tokenType: 'bearer',
    expiresAt: now + week,
  })

  const sessId = randomSessionId()
  await c.var.db.insert(schema.sessions).values({
    id: sessId,
    userId: u.id,
    expiresAt: now + week,
  })

  const cookieName = c.env.SESSION_COOKIE_NAME || 'td_session'
  const secure = c.req.url.startsWith('https')
  const cookie = `${cookieName}=${sessId}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${week}${secure ? '; Secure' : ''}`
  c.header('Set-Cookie', cookie)

  // Provision wallet assets + default settings (awaited so data is ready immediately)
  await provisionUserWallets(c.var.db, u.id)

  return c.json({
    user: apiUserRow({
      publicId: u.publicId,
      email: u.email,
      verificationStatus: u.verificationStatus,
      currencyId: u.currencyId,
      bios: u.bios,
    }),
    token: bearer,
  })
})

user.post('/getOtherBalance', async (c) => {
  const body = await c.req.json().catch(() => ({}))
  const parsed = userIdBodySchema.safeParse(body)
  if (!parsed.success) return c.json({ error: 'Invalid body' }, 400)
  const scope = assertUserScope(c, parsed.data.userId)
  if (!scope.ok) return scope.res

  const internalId = await getInternalUserIdByPublicId(c.var.db, String(parsed.data.userId))
  if (internalId == null) return c.json({ data: { fiat: 0, bonus: 0 } })

  const assets = await c.var.db
    .select()
    .from(schema.walletAssets)
    .where(eq(schema.walletAssets.userId, internalId))

  let fiat = 0
  let bonus = 0
  for (const a of assets) {
    const v = Number(a.userBalance)
    if (a.assetType === 'fiat') fiat += v
    else bonus += v
  }

  return c.json({ data: { fiat, bonus } })
})

user.post('/wonLoss', async (c) => {
  const body = await c.req.json().catch(() => ({}))
  const parsed = userIdBodySchema.safeParse(body)
  if (!parsed.success) return c.json({ error: 'Invalid body' }, 400)
  const scope = assertUserScope(c, parsed.data.userId)
  if (!scope.ok) return scope.res

  const internalId = await getInternalUserIdByPublicId(c.var.db, String(parsed.data.userId))
  if (internalId == null) return c.json({ won: [], loss: [], pending: [] })

  const rows = await c.var.db
    .select()
    .from(schema.trades)
    .where(eq(schema.trades.userId, internalId))

  const won: unknown[] = []
  const loss: unknown[] = []
  const pending: unknown[] = []
  for (const t of rows) {
    const p = rowToTradePosition(t)
    if (p.status === 'pending') pending.push(p)
    else if (p.status === 'completed' && typeof p.roi === 'number' && p.roi > 0) won.push(p)
    else if (p.status === 'completed' && typeof p.roi === 'number' && p.roi <= 0) loss.push(p)
  }
  return c.json({ won, loss, pending })
})

user.post('/getActivityLog', async (c) => {
  const body = await c.req.json().catch(() => ({}))
  const parsed = userIdBodySchema.safeParse(body)
  if (!parsed.success) return c.json({ error: 'Invalid body' }, 400)
  const scope = assertUserScope(c, parsed.data.userId)
  if (!scope.ok) return scope.res

  const internalId = await getInternalUserIdByPublicId(c.var.db, String(parsed.data.userId))
  if (internalId == null) return c.json({ data: [] })

  const logs = await c.var.db
    .select()
    .from(schema.activityLogs)
    .where(eq(schema.activityLogs.userId, internalId))
    .orderBy(desc(schema.activityLogs.time))
    .limit(100)

  return c.json({
    data: logs.map((l: ActivityLogRow) => ({
      id: l.id,
      time: l.time,
      ipAddress: l.ipAddress,
      location: l.location,
      device: l.device,
      status: l.status,
    })),
  })
})

user.post('/getOpenTrades', async (c) => {
  const body = await c.req.json().catch(() => ({}))
  const parsed = userIdBodySchema.safeParse(body)
  if (!parsed.success) return c.json({ error: 'Invalid body' }, 400)
  const scope = assertUserScope(c, parsed.data.userId)
  if (!scope.ok) return scope.res

  const internalId = await getInternalUserIdByPublicId(c.var.db, String(parsed.data.userId))
  if (internalId == null) return c.json({ data: [] })

  const rows = await c.var.db
    .select()
    .from(schema.trades)
    .where(
      and(eq(schema.trades.userId, internalId), inArray(schema.trades.status, ['open', 'pending']))
    )

  const data = rows.map((t: TradeRow) => {
    const p = rowToTradePosition(t)
    return {
      tradeId: p.tradeId,
      pair: p.pair,
      option: p.option,
      entryPrice: String(p.entryPrice),
      entryTime: p.entryTime,
      invested: String(p.invested),
      currency: p.currency,
    }
  })
  return c.json({ data })
})

user.post('/getClosedTrades', async (c) => {
  const body = await c.req.json().catch(() => ({}))
  const parsed = userIdBodySchema.safeParse(body)
  if (!parsed.success) return c.json({ error: 'Invalid body' }, 400)
  const scope = assertUserScope(c, parsed.data.userId)
  if (!scope.ok) return scope.res

  const internalId = await getInternalUserIdByPublicId(c.var.db, String(parsed.data.userId))
  if (internalId == null) return c.json({ data: [] })

  const rows = await c.var.db
    .select()
    .from(schema.trades)
    .where(
      and(
        eq(schema.trades.userId, internalId),
        inArray(schema.trades.status, ['completed', 'canceled', 'failed'])
      )
    )

  const data = rows.map((t: TradeRow) => {
    const p = rowToTradePosition(t)
    return {
      tradeId: p.tradeId,
      pair: p.pair,
      option: p.option,
      entryTime: p.entryTime,
      entryPrice: String(p.entryPrice),
      invested: String(p.invested),
      currency: p.currency,
      closingTime: p.closingTime,
      closingPrice: p.closingPrice === 'pending' ? 'Pending' : String(p.closingPrice),
      status: p.status,
      roi: p.roi === 'pending' ? 'pending' : String(p.roi),
    }
  })
  return c.json({ data })
})

user.post('/getTradePositions', async (c) => {
  const body = await c.req.json().catch(() => ({}))
  const parsed = userIdBodySchema.safeParse(body)
  if (!parsed.success) return c.json({ error: 'Invalid body' }, 400)
  const scope = assertUserScope(c, parsed.data.userId)
  if (!scope.ok) return scope.res

  const internalId = await getInternalUserIdByPublicId(c.var.db, String(parsed.data.userId))
  if (internalId == null) return c.json({ data: [] })

  const rows = await c.var.db
    .select()
    .from(schema.trades)
    .where(eq(schema.trades.userId, internalId))
    .orderBy(desc(schema.trades.entryTime))

  return c.json({ data: rows.map(rowToTradePosition) })
})

user.post('/closeTrade', async (c) => {
  const body = await c.req.json().catch(() => ({}))
  const parsed = closeTradeBodySchema.safeParse(body)
  if (!parsed.success) return c.json({ error: 'Invalid body' }, 400)
  const tradeId = parsed.data.tradeID

  const rows = await c.var.db.select().from(schema.trades).where(eq(schema.trades.id, tradeId)).limit(1)
  const t = rows[0]
  if (!t) return c.json({ error: 'Not found' }, 404)

  if (!trustedApiKey(c)) {
    if (!c.var.user || c.var.user.id !== t.userId) {
      return c.json({ error: 'Forbidden' }, 403)
    }
  }

  const now = Math.floor(Date.now() / 1000)
  const mpx = Number(t.marketPrice)
  const invested = Number(t.invested)
  const fees = Number(t.fees)
  const realized = Number((mpx * 0.001 - fees).toFixed(2))

  await c.var.db
    .update(schema.trades)
    .set({
      status: 'completed',
      closingTime: now,
      closingPrice: String(mpx),
      roi: String(realized),
      pnl: String(realized),
      note: `${t.note} Closed via API.`,
    })
    .where(eq(schema.trades.id, tradeId))

  const updated = await c.var.db.select().from(schema.trades).where(eq(schema.trades.id, tradeId)).limit(1)
  return c.json({ ok: true, trade: updated[0] ? rowToTradePosition(updated[0]) : null })
})

user.post('/getFiat', requireUser, async (c) => {
  const parsed = currencyIdBodySchema.safeParse(await c.req.json().catch(() => ({})))
  if (!parsed.success) return c.json({ error: 'Invalid body' }, 400)
  const id = Number(parsed.data.currencyId)
  const row = await c.var.db
    .select()
    .from(schema.fiatCurrencies)
    .where(eq(schema.fiatCurrencies.id, id))
    .limit(1)
  if (!row[0]) return c.json({ currency: null })
  return c.json({
    currency: { name: row[0].name, symbol: row[0].symbol },
  })
})

user.post('/getVerificationStatus', requireUser, async (c) => {
  const parsed = getVerificationStatusBodySchema.safeParse(await c.req.json().catch(() => ({})))
  if (!parsed.success) return c.json({ error: 'Invalid body' }, 400)
  const uid = parsed.data.userId
  const u = c.var.user!
  const publicMatch = String(u.publicId) === String(uid)
  const n = typeof uid === 'number' ? uid : Number(uid)
  const internalMatch = typeof n === 'number' && !Number.isNaN(n) && n === u.id
  if (!publicMatch && !internalMatch) return c.json({ error: 'Forbidden' }, 403)
  return c.json({ data: u.verificationStatus })
})

/** Issue HttpOnly session cookie for the current Bearer user (e.g. after register/onboarding without password login). */
user.post('/ensureWebSession', requireUser, async (c) => {
  const uid = c.var.user!.id
  const sessId = randomSessionId()
  const now = Math.floor(Date.now() / 1000)
  const week = 60 * 60 * 24 * 7
  await c.var.db.insert(schema.sessions).values({
    id: sessId,
    userId: uid,
    expiresAt: now + week,
  })
  const cookieName = c.env.SESSION_COOKIE_NAME || 'td_session'
  const secure = c.req.url.startsWith('https')
  c.header(
    'Set-Cookie',
    `${cookieName}=${sessId}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${week}${secure ? '; Secure' : ''}`
  )
  return c.json({ ok: true })
})

user.post('/updateUserStatus', requireUser, async (c) => {
  const parsed = updateUserStatusBodySchema.safeParse(await c.req.json().catch(() => ({})))
  if (!parsed.success) return c.json({ error: 'Invalid body' }, 400)
  const internal = await getInternalUserIdByPublicId(c.var.db, String(parsed.data.userId))
  if (internal == null || internal !== c.var.user!.id) return c.json({ error: 'Forbidden' }, 403)

  await c.var.db
    .update(schema.users)
    .set({ verificationStatus: parsed.data.status })
    .where(eq(schema.users.id, internal))

  return c.json(true)
})

user.post('/addBios', requireUser, async (c) => {
  const body = (await c.req.json().catch(() => ({}))) as Record<string, unknown>
  const password = typeof body.password === 'string' ? body.password : ''
  const { password: _pw, userId: _uid, ...rest } = body

  const [existing] = await c.var.db
    .select({ passwordHash: schema.users.passwordHash, bios: schema.users.bios })
    .from(schema.users)
    .where(eq(schema.users.id, c.var.user!.id))
    .limit(1)

  if (password.length > 0 && password.length < 8) {
    return c.json({ error: 'Password must be at least 8 characters' }, 400)
  }
  if (password.length === 0 && !existing?.passwordHash) {
    return c.json({ error: 'Password required' }, 400)
  }

  const prevBios =
    existing?.bios && typeof existing.bios === 'object' && !Array.isArray(existing.bios)
      ? (existing.bios as Record<string, unknown>)
      : {}
  const nextBios = { ...prevBios, ...rest }

  if (password.length >= 8) {
    const pwd = await hashPassword(password)
    await c.var.db
      .update(schema.users)
      .set({ passwordHash: pwd, bios: nextBios })
      .where(eq(schema.users.id, c.var.user!.id))
  } else {
    await c.var.db
      .update(schema.users)
      .set({ bios: nextBios })
      .where(eq(schema.users.id, c.var.user!.id))
  }
  return c.json({ ok: true })
})

user.post('/getAllFiats', requireUser, async (c) => {
  const rows = await c.var.db.select().from(schema.fiatCurrencies)
  return c.json({
    data: rows.map((r: FiatRow) => ({ id: r.id, name: r.name, symbol: r.symbol })),
  })
})

user.post('/updateCurrency', requireUser, async (c) => {
  const parsed = updateCurrencyBodySchema.safeParse(await c.req.json().catch(() => ({})))
  if (!parsed.success) return c.json({ error: 'Invalid body' }, 400)
  const uid = c.var.user!.id
  const [row] = await c.var.db
    .select({ bios: schema.users.bios })
    .from(schema.users)
    .where(eq(schema.users.id, uid))
    .limit(1)
  const prevBios =
    row?.bios && typeof row.bios === 'object' && !Array.isArray(row.bios)
      ? (row.bios as Record<string, unknown>)
      : {}
  const bios = { ...prevBios, country: parsed.data.country }

  await c.var.db
    .update(schema.users)
    .set({ currencyId: parsed.data.currency_id, bios })
    .where(eq(schema.users.id, uid))

  return c.json({ ok: true })
})

user.post('/addAdminWallet', requireUser, async (c) => {
  addAdminWalletBodySchema.safeParse(await c.req.json().catch(() => ({})))
  return c.json({ ok: true })
})

/** Sends welcome email once after onboarding (tracked in user bios). */
user.post('/welcomeOnboarding', requireUser, async (c) => {
  const uid = c.var.user!.id
  const [row] = await c.var.db
    .select({
      email: schema.users.email,
      bios: schema.users.bios,
    })
    .from(schema.users)
    .where(eq(schema.users.id, uid))
    .limit(1)
  if (!row?.email) return c.json({ error: 'User not found' }, 404)

  const prevBios =
    row.bios && typeof row.bios === 'object' && !Array.isArray(row.bios)
      ? (row.bios as Record<string, unknown>)
      : {}
  if (prevBios.onboardingWelcomeSent === true || prevBios.onboardingWelcomeSent === 1) {
    return c.json({ ok: true, alreadySent: true })
  }

  // Ensure all active coins + settings are provisioned (awaited)
  await provisionUserWallets(c.var.db, uid)

  const base = ((c.env as Env & { FRONTEND_URL?: string }).FRONTEND_URL ?? 'http://localhost:4000').replace(
    /\/$/,
    ''
  )
  const dashboardUrl = `${base}/dashboard`
  const firstName = typeof prevBios.firstName === 'string' ? prevBios.firstName : undefined
  const tpl = onboardingWelcomeEmailHtml({ dashboardUrl, firstName })
  const r = await sendEmail(c.env, row.email, tpl.subject, tpl.html)
  if (!r.ok) return c.json({ error: r.error }, 502)

  await c.var.db
    .update(schema.users)
    .set({
      bios: { ...prevBios, onboardingWelcomeSent: true },
    })
    .where(eq(schema.users.id, uid))

  return c.json({ ok: true })
})

export { user as userRoutes }
