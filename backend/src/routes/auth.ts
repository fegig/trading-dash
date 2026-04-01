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
  verificationPollBodySchema,
  emailConfirmationUrl,
} from '@trading-dash/shared'
import type { Env } from '../types/env'
import type { AppVariables } from '../types/env'
import { hashPassword } from '../lib/password'
import { hashOtp, randomSessionId } from '../lib/otp'
import { trustedApiKey } from '../lib/api-auth'
import { apiUserRow, fiatMetaForUser } from '../lib/api-user-response'
import { provisionUserWallets } from '../services/wallet-provisioning'
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

  const vToken = randomSessionId()
  const now = Math.floor(Date.now() / 1000)
  const exp = now + 172800
  await c.var.db.insert(schema.authTokens).values({
    userId: u.id,
    token: vToken,
    tokenType: 'email_verify',
    expiresAt: exp,
  })
  const base = (c.env as Env & { FRONTEND_URL?: string }).FRONTEND_URL ?? 'http://localhost:4000'
  const verifyUrl = emailConfirmationUrl(base, u.email, vToken, String(publicId))
  const tpl = verificationEmailHtml({ verifyUrl })
  const mail = await sendEmail(c.env, u.email, tpl.subject, tpl.html)
  if (!mail.ok) return c.json({ error: mail.error }, 502)

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
  // SPA routes live outside `/auth/*` so Vite dev proxy does not send browser navigations to the API.
  const resetUrl = `${base}/forgot?token=${encodeURIComponent(token)}&userId=${encodeURIComponent(u.publicId)}`
  const tpl = passwordResetEmailHtml({ resetUrl })
  await sendEmail(c.env, email, tpl.subject, tpl.html)

  return c.json({ ok: true })
})

auth.post('/createToken', async (c) => {
  if (!trustedApiKey(c)) return c.json({ error: 'Unauthorized' }, 401)
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
  if (uid == null) return c.json({ error: 'userId required' }, 400)

  const now = Math.floor(Date.now() / 1000)
  const exp = expires ?? now + 60 * 60 * 24 * 30
  const tokenType =
    status === 'external'
      ? 'external'
      : status === 'email_verify' || status === 'pending'
        ? 'email_verify'
        : 'bearer'
  await c.var.db.insert(schema.authTokens).values({
    userId: uid,
    token,
    tokenType,
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

auth.post('/verifyEmailAndStartSession', async (c) => {
  const parsed = verifyTokenBodySchema.safeParse(await c.req.json().catch(() => ({})))
  if (!parsed.success) return c.json({ error: 'Invalid body' }, 400)
  const { token, userId } = parsed.data

  const urows = await c.var.db
    .select()
    .from(schema.users)
    .where(eq(schema.users.publicId, userId))
    .limit(1)
  const u = urows[0]
  if (!u) return c.json({ error: 'Invalid link' }, 400)

  const now = Math.floor(Date.now() / 1000)
  const trows = await c.var.db
    .select()
    .from(schema.authTokens)
    .where(and(eq(schema.authTokens.token, token), eq(schema.authTokens.userId, u.id)))
    .limit(1)
  const tok = trows[0]
  if (!tok || (tok.expiresAt != null && tok.expiresAt < now)) {
    return c.json({ error: 'Invalid or expired link' }, 400)
  }
  if (tok.tokenType === 'reset' || tok.tokenType === 'external') {
    return c.json({ error: 'Invalid link' }, 400)
  }

  const legacyVerifyBearer = tok.tokenType === 'bearer' && u.verificationStatus === 0
  const isEmailVerify = tok.tokenType === 'email_verify' || legacyVerifyBearer
  if (!isEmailVerify) {
    return c.json({ error: 'Invalid link' }, 400)
  }

  await c.var.db.delete(schema.authTokens).where(eq(schema.authTokens.id, tok.id))

  if (u.verificationStatus === 0) {
    await c.var.db
      .update(schema.users)
      .set({ verificationStatus: 1 })
      .where(eq(schema.users.id, u.id))
  }

  const bearer = randomSessionId()
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
  c.header(
    'Set-Cookie',
    `${cookieName}=${sessId}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${week}${secure ? '; Secure' : ''}`
  )

  await provisionUserWallets(c.var.db, u.id)

  const [fresh] = await c.var.db.select().from(schema.users).where(eq(schema.users.id, u.id)).limit(1)
  if (!fresh) return c.json({ error: 'Failed' }, 500)

  const fiat = await fiatMetaForUser(c.var.db, fresh.currencyId)

  return c.json({
    user: apiUserRow(
      {
        publicId: fresh.publicId,
        email: fresh.email,
        verificationStatus: fresh.verificationStatus,
        currencyId: fresh.currencyId,
        bios: fresh.bios,
      },
      fiat
    ),
    token: bearer,
  })
})

auth.post('/verificationPoll', async (c) => {
  const parsed = verificationPollBodySchema.safeParse(await c.req.json().catch(() => ({})))
  if (!parsed.success) return c.json({ error: 'Invalid body' }, 400)
  const { userId, email } = parsed.data
  const rows = await c.var.db
    .select({
      email: schema.users.email,
      verificationStatus: schema.users.verificationStatus,
    })
    .from(schema.users)
    .where(eq(schema.users.publicId, String(userId)))
    .limit(1)
  const u = rows[0]
  if (!u || u.email.toLowerCase() !== email.trim().toLowerCase()) {
    return c.json({ error: 'Forbidden' }, 403)
  }
  return c.json({ data: u.verificationStatus })
})

auth.post('/sendVerificationEmail', async (c) => {
  const parsed = sendVerificationEmailBodySchema.safeParse(await c.req.json().catch(() => ({})))
  if (!parsed.success) return c.json({ error: 'Invalid body' }, 400)
  const { mailTo, userId, userName } = parsed.data

  const urows = await c.var.db
    .select()
    .from(schema.users)
    .where(eq(schema.users.publicId, String(userId)))
    .limit(1)
  const u = urows[0]
  if (!u || u.email.toLowerCase() !== mailTo.trim().toLowerCase()) {
    return c.json({ error: 'Forbidden' }, 403)
  }

  const vToken = randomSessionId()
  const now = Math.floor(Date.now() / 1000)
  const exp = now + 172800
  await c.var.db.insert(schema.authTokens).values({
    userId: u.id,
    token: vToken,
    tokenType: 'email_verify',
    expiresAt: exp,
  })

  const base = (c.env as Env & { FRONTEND_URL?: string }).FRONTEND_URL ?? 'http://localhost:4000'
  const verifyUrl = emailConfirmationUrl(base, mailTo, vToken, String(userId))
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
