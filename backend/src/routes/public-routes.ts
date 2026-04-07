import { Hono, type Context } from 'hono'
import type { Env } from '../types/env'
import type { AppVariables } from '../types/env'
import { ensurePlatformSettingsRow } from '../lib/platform-settings'
import { listFaqCategoriesForApi, listFaqItemsForApi } from '../lib/faq-queries'

/**
 * Absolute base for `/public/branding/*` URLs returned to browsers.
 * Prefer `BRANDING_PUBLIC_URL`; otherwise use the incoming request origin so links
 * hit the API Worker (not `FRONTEND_URL`, which often points at the SPA and breaks `<img src>`).
 */
function resolvePublicAssetBase(c: Context<{ Bindings: Env; Variables: AppVariables }>, env: Env): string {
  const fromEnv = env.BRANDING_PUBLIC_URL?.trim()
  if (fromEnv) return fromEnv.replace(/\/$/, '')
  try {
    const url = new URL(c.req.url)
    return `${url.protocol}//${url.host}`
  } catch {
    const fallback = env.FRONTEND_URL?.trim() || ''
    return fallback.replace(/\/$/, '')
  }
}

async function streamBrandingObject(
  c: Context<{ Bindings: Env; Variables: AppVariables }>,
  key: string
): Promise<Response> {
  const obj = await c.env.SITE_ASSETS.get(key)
  if (!obj?.body) return c.json({ error: 'Not found' }, 404)
  const headers = new Headers()
  headers.set('Content-Type', obj.httpMetadata?.contentType ?? 'application/octet-stream')
  headers.set('Cache-Control', 'public, max-age=86400, immutable')
  return new Response(obj.body, { headers })
}

export const publicRoutes = new Hono<{ Bindings: Env; Variables: AppVariables }>()

publicRoutes.get('/site-config', async (c) => {
  const row = await ensurePlatformSettingsRow(c.var.db)
  const base = resolvePublicAssetBase(c, c.env)
  const siteName = row.siteName?.trim() || ''
  const supportEmail = row.supportEmail?.trim() || ''
  const supportPhone = row.supportPhone?.trim() || ''
  const ogTitle = row.ogTitle?.trim() || ''
  const ogDescription = row.ogDescription?.trim() || ''
  let siteLogoUrl: string | null = null
  let emailLogoUrl: string | null = null
  let faviconUrl: string | null = null
  if (base.length > 0 && row.siteLogoR2Key) siteLogoUrl = `${base}/public/branding/site-logo`
  if (base.length > 0 && row.emailLogoR2Key) emailLogoUrl = `${base}/public/branding/email-logo`
  if (base.length > 0 && row.faviconR2Key) faviconUrl = `${base}/public/branding/favicon`
  const cacheKey = row.updatedAt
  return c.json({
    siteName: siteName || undefined,
    supportEmail: supportEmail || undefined,
    supportPhone: supportPhone || undefined,
    ogTitle: ogTitle || undefined,
    ogDescription: ogDescription || undefined,
    siteLogoUrl,
    emailLogoUrl,
    faviconUrl,
    /** Open Graph / social preview — same image as the dashboard header (`siteLogoUrl`). */
    ogImageUrl: siteLogoUrl,
    settingsUpdatedAt: cacheKey,
  })
})

publicRoutes.get('/branding/site-logo', async (c) => {
  const row = await ensurePlatformSettingsRow(c.var.db)
  if (!row.siteLogoR2Key) return c.json({ error: 'Not found' }, 404)
  return streamBrandingObject(c, row.siteLogoR2Key)
})

publicRoutes.get('/branding/email-logo', async (c) => {
  const row = await ensurePlatformSettingsRow(c.var.db)
  if (!row.emailLogoR2Key) return c.json({ error: 'Not found' }, 404)
  return streamBrandingObject(c, row.emailLogoR2Key)
})

publicRoutes.get('/branding/favicon', async (c) => {
  const row = await ensurePlatformSettingsRow(c.var.db)
  if (!row.faviconR2Key) return c.json({ error: 'Not found' }, 404)
  return streamBrandingObject(c, row.faviconR2Key)
})

publicRoutes.get('/faq/categories', async (c) => {
  const data = await listFaqCategoriesForApi(c.var.db)
  return c.json({ data })
})

publicRoutes.get('/faq/items', async (c) => {
  const catId = Number(c.req.query('catId'))
  if (!Number.isFinite(catId)) return c.json({ data: [], catInfo: null })
  const { catInfo, items } = await listFaqItemsForApi(c.var.db, catId)
  return c.json({
    catInfo,
    data: items,
  })
})
