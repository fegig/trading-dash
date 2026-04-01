import { createMiddleware } from 'hono/factory'
import { sessions, users, authTokens } from '../db/schema'
import type { Env } from '../types/env'
import type { AppVariables } from '../types/env'
import type { SessionUser } from '../services/user-context'
import { and, eq, gt, isNull, notInArray, or } from 'drizzle-orm'

async function loadUserFromSessionId(
  db: AppVariables['db'],
  sessionId: string
): Promise<SessionUser | null> {
  const now = Math.floor(Date.now() / 1000)
  const row = await db
    .select({
      id: users.id,
      publicId: users.publicId,
      email: users.email,
      currencyId: users.currencyId,
      verificationStatus: users.verificationStatus,
    })
    .from(sessions)
    .innerJoin(users, eq(sessions.userId, users.id))
    .where(and(eq(sessions.id, sessionId), gt(sessions.expiresAt, now)))
    .limit(1)

  return row[0]
    ? {
        id: row[0].id,
        publicId: row[0].publicId,
        email: row[0].email,
        currencyId: row[0].currencyId,
        verificationStatus: row[0].verificationStatus,
      }
    : null
}

async function loadUserFromBearer(db: AppVariables['db'], token: string): Promise<SessionUser | null> {
  const now = Math.floor(Date.now() / 1000)
  const row = await db
    .select({
      id: users.id,
      publicId: users.publicId,
      email: users.email,
      currencyId: users.currencyId,
      verificationStatus: users.verificationStatus,
    })
    .from(authTokens)
    .innerJoin(users, eq(authTokens.userId, users.id))
    .where(
      and(
        eq(authTokens.token, token),
        or(isNull(authTokens.expiresAt), gt(authTokens.expiresAt, now)),
        notInArray(authTokens.tokenType, ['email_verify', 'reset', 'external'])
      )
    )
    .limit(1)

  if (!row[0]) return null
  return {
    id: row[0].id,
    publicId: row[0].publicId,
    email: row[0].email,
    currencyId: row[0].currencyId,
    verificationStatus: row[0].verificationStatus,
  }
}

export const sessionMiddleware = createMiddleware<{ Bindings: Env; Variables: AppVariables }>(
  async (c, next) => {
    const cookieName = c.env.SESSION_COOKIE_NAME || 'td_session'
    const cookie = c.req.raw.headers.get('cookie') ?? ''
    const match = cookie.match(new RegExp(`(?:^|;\\s*)${cookieName}=([^;]+)`))
    const sessionId = match?.[1] ? decodeURIComponent(match[1]) : null

    let user: SessionUser | null = null
    if (sessionId) {
      user = await loadUserFromSessionId(c.var.db, sessionId)
    }
    if (!user) {
      const auth = c.req.header('authorization')
      const bearer = auth?.startsWith('Bearer ') ? auth.slice(7).trim() : null
      if (bearer) {
        user = await loadUserFromBearer(c.var.db, bearer)
      }
    }
    c.set('user', user)
    await next()
  }
)

export const requireUser = createMiddleware<{ Bindings: Env; Variables: AppVariables }>(
  async (c, next) => {
    if (!c.var.user) {
      return c.json({ error: 'Unauthorized' }, 401)
    }
    await next()
  }
)
