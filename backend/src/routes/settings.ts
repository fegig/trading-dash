import { Hono } from 'hono'
import { eq, desc, and } from 'drizzle-orm'
import type { Env } from '../types/env'
import type { AppVariables } from '../types/env'
import { requireUser } from '../middleware/session'
import * as schema from '../db/schema'
import { provisionDefaultSettings } from '../services/wallet-provisioning'

const settings = new Hono<{ Bindings: Env; Variables: AppVariables }>()

settings.get('/toggles', requireUser, async (c) => {
  const uid = c.var.user!.id

  // Auto-provision defaults if the user has no rows yet
  await provisionDefaultSettings(c.var.db, uid)

  const rows = await c.var.db
    .select()
    .from(schema.settingToggles)
    .where(eq(schema.settingToggles.userId, uid))

  return c.json(
    rows.map((r) => ({
      id: r.toggleId,
      section: r.section,
      title: r.title,
      description: r.description,
      enabled: r.enabled,
      icon: r.icon,
      tone: r.tone,
    }))
  )
})

settings.put('/toggles/:toggleId', requireUser, async (c) => {
  const toggleId = c.req.param('toggleId')
  const uid = c.var.user!.id
  const body = (await c.req.json().catch(() => ({}))) as { enabled?: boolean }

  if (typeof body.enabled !== 'boolean') {
    return c.json({ error: 'enabled (boolean) is required' }, 400)
  }

  // Check the row exists for this user
  const [existing] = await c.var.db
    .select()
    .from(schema.settingToggles)
    .where(and(eq(schema.settingToggles.userId, uid), eq(schema.settingToggles.toggleId, toggleId)))
    .limit(1)

  if (!existing) return c.json({ error: 'Toggle not found' }, 404)

  await c.var.db
    .update(schema.settingToggles)
    .set({ enabled: body.enabled })
    .where(and(eq(schema.settingToggles.userId, uid), eq(schema.settingToggles.toggleId, toggleId)))

  // When the 2FA login toggle changes, sync it to user.bios so login flow picks it up
  if (toggleId === 'two-factor-login') {
    const [userRow] = await c.var.db
      .select({ bios: schema.users.bios })
      .from(schema.users)
      .where(eq(schema.users.id, uid))
      .limit(1)

    const prevBios =
      userRow?.bios && typeof userRow.bios === 'object' && !Array.isArray(userRow.bios)
        ? (userRow.bios as Record<string, unknown>)
        : {}

    await c.var.db
      .update(schema.users)
      .set({ bios: { ...prevBios, loginOtpEnabled: body.enabled } })
      .where(eq(schema.users.id, uid))
  }

  return c.json({ ok: true, toggleId, enabled: body.enabled })
})

settings.get('/activity-logs', requireUser, async (c) => {
  const rows = await c.var.db
    .select()
    .from(schema.activityLogs)
    .where(eq(schema.activityLogs.userId, c.var.user!.id))
    .orderBy(desc(schema.activityLogs.time))
    .limit(100)

  return c.json(
    rows.map((l) => ({
      id: l.id,
      time: l.time,
      ipAddress: l.ipAddress,
      location: l.location,
      device: l.device,
      status: l.status,
    }))
  )
})

export { settings as settingsRoutes }
