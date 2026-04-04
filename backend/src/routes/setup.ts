/**
 * ONE-TIME SETUP ROUTE — delete this file and remove from app.ts after use.
 *
 * POST /setup/create-admin
 * Header: x-api-key: <your API_KEY from .env>
 * Body (optional JSON):
 *   { "email": "admin@example.com", "password": "changeme", "firstName": "Super", "lastName": "Admin" }
 *
 * Defaults if body is omitted:
 *   email    → admin@blocktrade.com
 *   password → Admin@12345!
 */

import { Hono } from 'hono'
import { eq } from 'drizzle-orm'
import type { Env, AppVariables } from '../types/env'
import * as schema from '../db/schema'
import { hashPassword } from '../lib/password'
import { trustedApiKey } from '../lib/api-auth'
import { mergeUserBiosFields } from '../lib/user-bios'

const setup = new Hono<{ Bindings: Env; Variables: AppVariables }>()

setup.post('/create-admin', async (c) => {
  if (!trustedApiKey(c)) {
    return c.json({ error: 'Forbidden — x-api-key required' }, 403)
  }

  const body = await c.req.json().catch(() => ({})) as Record<string, unknown>
  const email     = typeof body.email     === 'string' && body.email.trim()
    ? body.email.trim()
    : 'admin@blocktrade.com'
  const password  = typeof body.password  === 'string' && body.password.trim()
    ? body.password.trim()
    : 'Admin@12345!'
  const firstName = typeof body.firstName === 'string' ? body.firstName : 'Super'
  const lastName  = typeof body.lastName  === 'string' ? body.lastName  : 'Admin'

  if (password.length < 8) {
    return c.json({ error: 'Password must be at least 8 characters' }, 400)
  }

  // Check if user already exists
  const [existing] = await c.var.db
    .select({ id: schema.users.id, role: schema.users.role })
    .from(schema.users)
    .where(eq(schema.users.email, email))
    .limit(1)

  if (existing) {
    if (existing.role === 'admin') {
      return c.json({ ok: true, message: `Admin already exists: ${email}` })
    }
    // Promote existing user to admin
    await c.var.db
      .update(schema.users)
      .set({ role: 'admin' })
      .where(eq(schema.users.id, existing.id))
    return c.json({ ok: true, message: `Promoted existing user to admin: ${email}` })
  }

  // Create new admin user
  const publicId     = crypto.randomUUID()
  const passwordHash = await hashPassword(password)

  const [result] = await c.var.db
    .insert(schema.users)
    .values({
      publicId,
      email,
      passwordHash,
      currencyId: 1,
      verificationStatus: 3,
      role: 'admin',
    })
    .$returningId()

  const userId = result.id

  await mergeUserBiosFields(c.var.db, userId, {
    firstName,
    lastName,
    onboardingWelcomeSent: true,
  })

  return c.json({
    ok: true,
    message: 'Super admin created',
    email,
    password,
    userId: publicId,
    warning: 'Delete /setup route from app.ts after use',
  })
})

export { setup as setupRoutes }
