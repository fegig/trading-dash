import { Hono } from 'hono'
import { eq, count } from 'drizzle-orm'
import { affiliateSummaryBodySchema } from '@trading-dash/shared'
import type { Env } from '../types/env'
import type { AppVariables } from '../types/env'
import { assertUserScope } from '../lib/api-auth'
import { getInternalUserIdByPublicId } from '../services/users-repo'
import * as schema from '../db/schema'

const affiliate = new Hono<{ Bindings: Env; Variables: AppVariables }>()

affiliate.post('/summary', async (c) => {
  const parsed = affiliateSummaryBodySchema.safeParse(await c.req.json().catch(() => ({})))
  if (!parsed.success) return c.json({ error: 'Invalid body' }, 400)
  const scope = assertUserScope(c, parsed.data.userId)
  if (!scope.ok) return scope.res

  const internalId = await getInternalUserIdByPublicId(c.var.db, parsed.data.userId)
  if (internalId == null) return c.json({ referrals: 0, earnings: 0 })

  const cnt = await c.var.db
    .select({ n: count() })
    .from(schema.affiliateReferrals)
    .where(eq(schema.affiliateReferrals.referrerUserId, internalId))

  return c.json({
    data: {
      referrals: Number(cnt[0]?.n ?? 0),
      earningsUsd: 0,
    },
  })
})

affiliate.get('/referrals', async (c) => {
  const userId = c.req.query('userId')
  if (!userId) return c.json({ error: 'userId required' }, 400)
  const scope = assertUserScope(c, userId)
  if (!scope.ok) return scope.res

  const internalId = await getInternalUserIdByPublicId(c.var.db, userId)
  if (internalId == null) return c.json([])

  const rows = await c.var.db
    .select({ referred: schema.users.publicId, createdAt: schema.affiliateReferrals.createdAt })
    .from(schema.affiliateReferrals)
    .innerJoin(schema.users, eq(schema.affiliateReferrals.referredUserId, schema.users.id))
    .where(eq(schema.affiliateReferrals.referrerUserId, internalId))

  return c.json(
    rows.map((r) => ({
      userId: r.referred,
      joinedAt: r.createdAt,
    }))
  )
})

export { affiliate as affiliateRoutes }
