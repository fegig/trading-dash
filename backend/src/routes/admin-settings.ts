import type { Context, Hono } from 'hono'
import { z } from 'zod'
import { eq } from 'drizzle-orm'
import type { Env } from '../types/env'
import type { AppVariables } from '../types/env'
import { requireAdmin } from '../middleware/admin'
import * as schema from '../db/schema'
import {
  ensurePlatformSettingsRow,
  updatePlatformSettingsText,
  setSiteLogoKey,
  setEmailLogoKey,
  setFaviconKey,
} from '../lib/platform-settings'
import {
  BRANDING_EMAIL_R2_KEY,
  BRANDING_SITE_R2_KEY,
  BRANDING_FAVICON_R2_KEY,
  BRANDING_ALLOWED_MIME,
  BRANDING_LOGO_MAX_BYTES,
  BRANDING_FAVICON_MAX_BYTES,
  FAVICON_ALLOWED_MIME,
} from '../lib/branding-constants'
import { hashPassword, verifyPassword } from '../lib/password'

const patchSettingsSchema = z.object({
  siteName: z.string().max(128).optional(),
  supportEmail: z.string().max(255).optional(),
  supportPhone: z.string().max(64).optional(),
  ogTitle: z.string().max(255).optional(),
  ogDescription: z.string().max(512).optional(),
})

const passwordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(8).max(128),
})

function isFileLike(v: unknown): v is File {
  return (
    typeof v === 'object' &&
    v !== null &&
    typeof (v as File).arrayBuffer === 'function' &&
    typeof (v as File).size === 'number'
  )
}

export function registerAdminSettingsRoutes(
  admin: Hono<{ Bindings: Env; Variables: AppVariables }>
): void {
  admin.get('/settings', requireAdmin, async (c) => {
    const row = await ensurePlatformSettingsRow(c.var.db)
    return c.json({
      siteName: row.siteName,
      supportEmail: row.supportEmail,
      supportPhone: row.supportPhone,
      ogTitle: row.ogTitle,
      ogDescription: row.ogDescription,
      hasSiteLogo: Boolean(row.siteLogoR2Key),
      hasEmailLogo: Boolean(row.emailLogoR2Key),
      hasFavicon: Boolean(row.faviconR2Key),
      settingsUpdatedAt: row.updatedAt,
    })
  })

  admin.patch('/settings', requireAdmin, async (c) => {
    let body: unknown
    try {
      body = await c.req.json()
    } catch {
      return c.json({ error: 'Invalid JSON' }, 400)
    }
    const parsed = patchSettingsSchema.safeParse(body)
    if (!parsed.success) return c.json({ error: parsed.error.flatten() }, 400)
    await ensurePlatformSettingsRow(c.var.db)
    await updatePlatformSettingsText(c.var.db, parsed.data)
    const row = await ensurePlatformSettingsRow(c.var.db)
    return c.json({
      siteName: row.siteName,
      supportEmail: row.supportEmail,
      supportPhone: row.supportPhone,
      ogTitle: row.ogTitle,
      ogDescription: row.ogDescription,
      hasSiteLogo: Boolean(row.siteLogoR2Key),
      hasEmailLogo: Boolean(row.emailLogoR2Key),
      hasFavicon: Boolean(row.faviconR2Key),
      settingsUpdatedAt: row.updatedAt,
    })
  })

  async function handleLogoUpload(
    c: Context<{ Bindings: Env; Variables: AppVariables }>,
    which: 'site' | 'email'
  ): Promise<Response> {
    let form: FormData
    try {
      form = await c.req.formData()
    } catch {
      return c.json({ error: 'Expected multipart form data' }, 400)
    }
    const file = form.get('file')
    if (!isFileLike(file)) return c.json({ error: 'Missing file field' }, 400)
    if (file.size > BRANDING_LOGO_MAX_BYTES) {
      return c.json({ error: `File too large (max ${BRANDING_LOGO_MAX_BYTES} bytes)` }, 400)
    }
    const mime = (file.type || 'application/octet-stream').toLowerCase()
    if (!BRANDING_ALLOWED_MIME.has(mime)) {
      return c.json({ error: 'File type not allowed for logo' }, 415)
    }
    const buf = await file.arrayBuffer()
    const key = which === 'site' ? BRANDING_SITE_R2_KEY : BRANDING_EMAIL_R2_KEY
    await c.env.SITE_ASSETS.put(key, buf, {
      httpMetadata: { contentType: mime },
    })
    await ensurePlatformSettingsRow(c.var.db)
    if (which === 'site') await setSiteLogoKey(c.var.db, key)
    else await setEmailLogoKey(c.var.db, key)
    return c.json({ ok: true, hasSiteLogo: which === 'site', hasEmailLogo: which === 'email' })
  }

  admin.post('/settings/branding/site-logo', requireAdmin, async (c) => handleLogoUpload(c, 'site'))
  admin.post('/settings/branding/email-logo', requireAdmin, async (c) => handleLogoUpload(c, 'email'))

  admin.post('/settings/branding/favicon', requireAdmin, async (c) => {
    let form: FormData
    try {
      form = await c.req.formData()
    } catch {
      return c.json({ error: 'Expected multipart form data' }, 400)
    }
    const file = form.get('file')
    if (!isFileLike(file)) return c.json({ error: 'Missing file field' }, 400)
    if (file.size > BRANDING_FAVICON_MAX_BYTES) {
      return c.json({ error: `File too large (max ${BRANDING_FAVICON_MAX_BYTES} bytes)` }, 400)
    }
    const mime = (file.type || 'application/octet-stream').toLowerCase()
    if (!FAVICON_ALLOWED_MIME.has(mime)) {
      return c.json({ error: 'Use ICO, PNG, SVG, GIF, JPEG, or WebP for favicon' }, 415)
    }
    const buf = await file.arrayBuffer()
    await c.env.SITE_ASSETS.put(BRANDING_FAVICON_R2_KEY, buf, {
      httpMetadata: { contentType: mime },
    })
    await ensurePlatformSettingsRow(c.var.db)
    await setFaviconKey(c.var.db, BRANDING_FAVICON_R2_KEY)
    return c.json({ ok: true, hasFavicon: true })
  })

  admin.patch('/me/password', requireAdmin, async (c) => {
    let body: unknown
    try {
      body = await c.req.json()
    } catch {
      return c.json({ error: 'Invalid JSON' }, 400)
    }
    const parsed = passwordSchema.safeParse(body)
    if (!parsed.success) return c.json({ error: parsed.error.flatten() }, 400)

    const userId = c.var.user!.id
    const [row] = await c.var.db
      .select({ passwordHash: schema.users.passwordHash })
      .from(schema.users)
      .where(eq(schema.users.id, userId))
      .limit(1)
    if (!row?.passwordHash) return c.json({ error: 'Password login not enabled for this account' }, 400)
    const ok = await verifyPassword(parsed.data.currentPassword, row.passwordHash)
    if (!ok) return c.json({ error: 'Current password is incorrect' }, 401)

    const nextHash = await hashPassword(parsed.data.newPassword)
    await c.var.db
      .update(schema.users)
      .set({ passwordHash: nextHash })
      .where(eq(schema.users.id, userId))

    return c.json({ ok: true })
  })
}
