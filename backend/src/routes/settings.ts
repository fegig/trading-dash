import { Hono } from 'hono'
import { eq, desc } from 'drizzle-orm'
import type { Env } from '../types/env'
import type { AppVariables } from '../types/env'
import { requireUser } from '../middleware/session'
import * as schema from '../db/schema'

const settings = new Hono<{ Bindings: Env; Variables: AppVariables }>()

settings.get('/toggles', requireUser, async (c) => {
  const rows = await c.var.db
    .select()
    .from(schema.settingToggles)
    .where(eq(schema.settingToggles.userId, c.var.user!.id))

  return c.json(
    rows.map((r) => ({
      id: r.id,
      section: r.section,
      title: r.title,
      description: r.description,
      enabled: r.enabled,
      icon: r.icon,
      tone: r.tone,
    }))
  )
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
