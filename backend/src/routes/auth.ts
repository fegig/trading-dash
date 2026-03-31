import { Hono } from 'hono'
import { eq, and } from 'drizzle-orm'
import {
  sendOTPBodySchema,
  verifyOTPBodySchema,
  registerBodySchema,
  passwordResetBodySchema,
  verifyTokenBodySchema,
  createTokenBodySchema,
  sendVerificationEmailBodySchema,
  sendLoginOtpEmailBodySchema,
  loginNotificationBodySchema,
} from '@trading-dash/shared'
import type { Env } from '../types/env'
import type { AppVariables } from '../types/env'
import { requireUser } from '../middleware/session'
import { hashPassword } from '../lib/password'
import { hashOtp, randomSessionId } from '../lib/otp'
import * as schema from '../db/schema'
import { sendEmail } from '../email/resend-client'
import {
  otpEmailHtml,
  verificationEmailHtml,
  passwordResetEmailHtml,
  loginNotificationEmailHtml,
} from '../email/templates'
import { rateLimitMiddleware } from '../middleware/rate-limit'

const auth = new Hono<{ Bindings: Env; Variables: AppVariables }>()

auth.use(
  '*',
  rateLimitMiddleware({
    limit: 30,
    windowSec: 60,
    keyPrefix: 'auth',
    keyFrom: (ctx) =>
      ctx.req.header('cf-connecting-ip') ?? ctx.req.header('x-forwarded-for') ?? 'local',
  })
)

auth.post('/register', async (c) => {
  const parsed = registerBodySchema.safeParse(await c.req.json().catch(() => ({})))
  if (!parsed.success) return c.json({ error: 'Invalid body' }, 400)
  const { userId: publicId, email, refBy, password } = parsed.data

  const existing = await c.var.db
    .select({ id: schema.users.id })
    .from(schema.users)
    .where(eq(schema.users.email, email))
    .limit(1)
  if (existing[0]) return c.json({ error: 'Email already registered' }, 409)

  const pwd = password ? await hashPassword(password) : null
  await c.var.db.insert(schema.users).values({
    publicId,
    email,
    passwordHash: pwd,
    refBy: refBy ?? undefined,
    verificationStatus: 0,
  })

  const row = await c.var.db
    .select()
    .from(schema.users)
    .where(eq(schema.users.publicId, publicId))
    .limit(1)
  const u = row[0]
  if (!u) return c.json({ error: 'Failed' }, 500)

  if (refBy) {
    const ref = await c.var.db
      .select()
      .from(schema.users)
      .where(eq(schema.users.publicId, refBy))
      .limit(1)
    if (ref[0]) {
      await c.var.db.insert(schema.affiliateReferrals).values({
        referrerUserId: ref[0].id,
        referredUserId: u.id,
      })
    }
  }

  return c.json({
    ok: true,
    user: {
      user_id: u.publicId,
      email: u.email,
      verificationStatus: String(u.verificationStatus),
    },
  })
})

auth.post('/sendOTP', async (c) => {
  const parsed = sendOTPBodySchema.safeParse(await c.req.json().catch(() => ({})))
  if (!parsed.success) return c.json({ error: 'Invalid body' }, 400)
  const { userId, messageId, code, expires } = parsed.data

  const internal = await c.var.db
    .select()
    .from(schema.users)
    .where(eq(schema.users.publicId, String(userId)))
    .limit(1)
  const u = internal[0]
  if (!u) return c.json({ error: 'User not found' }, 404)

  await c.var.db.insert(schema.otpMessages).values({
    userId: u.id,
    messageId,
    codeHash: hashOtp(code),
    expiresAt: expires,
  })

  const tpl = otpEmailHtml({ code })
  const r = await sendEmail(c.env, u.email, tpl.subject, tpl.html)
  if (!r.ok) return c.json({ error: r.error }, 502)

  return c.json({ ok: true })
})

auth.post('/verifyOTP', async (c) => {
  const parsed = verifyOTPBodySchema.safeParse(await c.req.json().catch(() => ({})))
  if (!parsed.success) return c.json({ error: 'Invalid body' }, 400)
  const { userId, messageId, code } = parsed.data

  const urows = await c.var.db
    .select()
    .from(schema.users)
    .where(eq(schema.users.publicId, String(userId)))
    .limit(1)
  const u = urows[0]
  if (!u) return c.json({ ok: false }, 400)

  const now = Math.floor(Date.now() / 1000)
  const otpRows = await c.var.db
    .select()
    .from(schema.otpMessages)
    .where(
      and(
        eq(schema.otpMessages.userId, u.id),
        eq(schema.otpMessages.messageId, messageId),
        eq(schema.otpMessages.codeHash, hashOtp(code))
      )
    )
    .limit(1)
  const otp = otpRows[0]
  if (!otp || otp.expiresAt < now) return c.json({ ok: false }, 400)

  const sessId = randomSessionId()
  const week = 60 * 60 * 24 * 7
  await c.var.db.insert(schema.sessions).values({
    id: sessId,
    userId: u.id,
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

auth.post('/passwordReset', async (c) => {
  const parsed = passwordResetBodySchema.safeParse(await c.req.json().catch(() => ({})))
  if (!parsed.success) return c.json({ error: 'Invalid body' }, 400)
  const email = parsed.data.email

  const rows = await c.var.db.select().from(schema.users).where(eq(schema.users.email, email)).limit(1)
  const u = rows[0]
  if (!u) return c.json({ ok: true })

  const token = randomSessionId()
  const now = Math.floor(Date.now() / 1000)
  await c.var.db.insert(schema.authTokens).values({
    userId: u.id,
    token,
    tokenType: 'reset',
    expiresAt: now + 3600,
  })

  const base = (c.env as Env & { FRONTEND_URL?: string }).FRONTEND_URL ?? 'http://localhost:4000'
  const resetUrl = `${base}/auth/forgot?token=${encodeURIComponent(token)}&userId=${encodeURIComponent(u.publicId)}`
  const tpl = passwordResetEmailHtml({ resetUrl })
  await sendEmail(c.env, email, tpl.subject, tpl.html)

  return c.json({ ok: true })
})

auth.post('/createToken', async (c) => {
  const body = await c.req.json().catch(() => ({}))
  const parsed = createTokenBodySchema.safeParse(body)
  if (!parsed.success) return c.json({ error: 'Invalid body' }, 400)
  const { token, time, expires, status, userId } = parsed.data as {
    token: string
    time?: number
    expires?: number
    status?: string
    userId?: string
  }

  let uid: number | null = null
  if (userId) {
    const r = await c.var.db
      .select()
      .from(schema.users)
      .where(eq(schema.users.publicId, String(userId)))
      .limit(1)
    uid = r[0]?.id ?? null
  }
  if (uid == null && c.var.user) uid = c.var.user.id
  if (uid == null) return c.json({ error: 'userId required' }, 400)

  const now = Math.floor(Date.now() / 1000)
  const exp = expires ?? now + 60 * 60 * 24 * 30
  await c.var.db.insert(schema.authTokens).values({
    userId: uid,
    token,
    tokenType: status === 'external' ? 'external' : 'bearer',
    expiresAt: exp,
  })

  return c.json({ data: { token, expires: exp, time: time ?? now } })
})

auth.post('/verifyToken', async (c) => {
  const parsed = verifyTokenBodySchema.safeParse(await c.req.json().catch(() => ({})))
  if (!parsed.success) return c.json({ error: 'Invalid body' }, 400)
  const { token, userId } = parsed.data

  const urows = await c.var.db
    .select()
    .from(schema.users)
    .where(eq(schema.users.publicId, userId))
    .limit(1)
  const u = urows[0]
  if (!u) return c.json(false)

  const now = Math.floor(Date.now() / 1000)
  const trows = await c.var.db
    .select()
    .from(schema.authTokens)
    .where(and(eq(schema.authTokens.token, token), eq(schema.authTokens.userId, u.id)))
    .limit(1)
  const tok = trows[0]
  if (!tok || (tok.expiresAt != null && tok.expiresAt < now)) return c.json(false)

  return c.json(true)
})

auth.post('/regRefferal', requireUser, async (c) => {
  const body = (await c.req.json().catch(() => ({}))) as { refBy?: string }
  if (!body.refBy) return c.json({ error: 'refBy required' }, 400)
  const ref = await c.var.db
    .select()
    .from(schema.users)
    .where(eq(schema.users.publicId, body.refBy))
    .limit(1)
  if (!ref[0]) return c.json({ ok: false })
  await c.var.db.insert(schema.affiliateReferrals).values({
    referrerUserId: ref[0].id,
    referredUserId: c.var.user!.id,
  })
  return c.json({ ok: true })
})

auth.post('/sendVerificationEmail', requireUser, async (c) => {
  const parsed = sendVerificationEmailBodySchema.safeParse(await c.req.json().catch(() => ({})))
  if (!parsed.success) return c.json({ error: 'Invalid body' }, 400)
  const { mailTo, userId, token, userName } = parsed.data
  if (String(userId) !== c.var.user!.publicId && c.var.user!.email !== mailTo) {
    return c.json({ error: 'Forbidden' }, 403)
  }
  const base = (c.env as Env & { FRONTEND_URL?: string }).FRONTEND_URL ?? 'http://localhost:4000'
  const verifyUrl = `${base}/auth/verify-email?token=${encodeURIComponent(token)}&userId=${encodeURIComponent(String(userId))}`
  const tpl = verificationEmailHtml({ userName, verifyUrl })
  const r = await sendEmail(c.env, mailTo, tpl.subject, tpl.html)
  if (!r.ok) return c.json({ error: r.error }, 502)
  return c.json({ ok: true })
})

auth.post('/sendLoginOtpEmail', async (c) => {
  const parsed = sendLoginOtpEmailBodySchema.safeParse(await c.req.json().catch(() => ({})))
  if (!parsed.success) return c.json({ error: 'Invalid body' }, 400)
  const tpl = otpEmailHtml({ code: parsed.data.otpCode })
  const r = await sendEmail(c.env, parsed.data.mailTo, tpl.subject, tpl.html)
  if (!r.ok) return c.json({ error: r.error }, 502)
  return c.json({ ok: true })
})

auth.post('/loginNotification', async (c) => {
  const parsed = loginNotificationBodySchema.safeParse(await c.req.json().catch(() => ({})))
  if (!parsed.success) return c.json({ error: 'Invalid body' }, 400)
  const { userMail, device, time } = parsed.data
  const tpl = loginNotificationEmailHtml({ device, time })
  await sendEmail(c.env, userMail, tpl.subject, tpl.html)
  return c.json({ ok: true })
})

export { auth as authRoutes }
