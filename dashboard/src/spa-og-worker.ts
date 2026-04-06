import type { SpaOgWorkerEnv } from './spa-og-worker-env'

/**
 * Runs ahead of static assets (`run_worker_first`). For known social crawlers or `?__og=1`,
 * returns minimal HTML with OG/Twitter meta from `GET /public/site-config` on the API Worker.
 * Set `SITE_CONFIG_URL` in wrangler vars to override (full URL); otherwise uses `VITE_API_URL` + `/public/site-config`.
 */
const SITE_NAME_FALLBACK = 'BlockTrade'

type SiteConfigJson = {
  siteName?: string
  ogTitle?: string
  ogDescription?: string
  ogImageUrl?: string | null
  settingsUpdatedAt?: number
}

const OG_BOT_UA =
  /facebookexternalhit|Facebot|Twitterbot|LinkedInBot|Slackbot|Discordbot|WhatsApp|TelegramBot|Pinterest|vkShare|redditbot|Embedly/i

function trimSlash(s: string): string {
  return s.replace(/\/+$/, '')
}

function isProbablyStaticAsset(pathname: string): boolean {
  return /\.(?:js|mjs|css|map|png|jpe?g|gif|svg|webp|ico|woff2?|ttf|eot|json|txt|xml|wasm|avif)$/i.test(
    pathname
  )
}

function wantsOgHtml(request: Request): boolean {
  const url = new URL(request.url)
  if (url.searchParams.get('__og') === '1') return true
  const ua = request.headers.get('user-agent') ?? ''
  return OG_BOT_UA.test(ua)
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function bustAssetUrl(url: string, v: number | undefined): string {
  if (!url) return url
  const n = v ?? 0
  return `${url}${url.includes('?') ? '&' : '?'}v=${n}`
}

async function fetchSiteConfig(env: SpaOgWorkerEnv): Promise<SiteConfigJson | null> {
  const override = env.SITE_CONFIG_URL?.trim()
  const url =
    override && override.length > 0
      ? override
      : `${trimSlash(env.VITE_API_URL)}/public/site-config`
  try {
    const res = await fetch(url, { headers: { Accept: 'application/json' } })
    if (!res.ok) return null
    return (await res.json()) as SiteConfigJson
  } catch {
    return null
  }
}

function buildOgHtml(pageUrl: string, cfg: SiteConfigJson | null): string {
  const name = cfg?.siteName?.trim() || SITE_NAME_FALLBACK
  const title = cfg?.ogTitle?.trim() || name
  const desc =
    cfg?.ogDescription?.trim() || `${name} — trading, wallet, and account workspace.`
  const v = cfg?.settingsUpdatedAt
  const ogImage = cfg?.ogImageUrl ? bustAssetUrl(cfg.ogImageUrl, v) : ''

  const meta: string[] = [
    `<meta charset="UTF-8" />`,
    `<meta name="viewport" content="width=device-width, initial-scale=1.0" />`,
    `<title>${escapeHtml(title)}</title>`,
    `<link rel="canonical" href="${escapeHtml(pageUrl)}" />`,
    `<meta property="og:title" content="${escapeHtml(title)}" />`,
    `<meta property="og:description" content="${escapeHtml(desc)}" />`,
    `<meta property="og:type" content="website" />`,
    `<meta property="og:url" content="${escapeHtml(pageUrl)}" />`,
  ]
  if (ogImage) {
    meta.push(`<meta property="og:image" content="${escapeHtml(ogImage)}" />`)
  }
  meta.push(
    `<meta name="twitter:card" content="summary_large_image" />`,
    `<meta name="twitter:title" content="${escapeHtml(title)}" />`,
    `<meta name="twitter:description" content="${escapeHtml(desc)}" />`
  )
  if (ogImage) {
    meta.push(`<meta name="twitter:image" content="${escapeHtml(ogImage)}" />`)
  }

  return `<!DOCTYPE html>
<html lang="en">
<head>
${meta.join('\n')}
</head>
<body></body>
</html>`
}

export default {
  async fetch(request: Request, env: SpaOgWorkerEnv): Promise<Response> {
    const url = new URL(request.url)

    if (request.method !== 'GET' && request.method !== 'HEAD') {
      return env.ASSETS.fetch(request)
    }

    if (isProbablyStaticAsset(url.pathname)) {
      return env.ASSETS.fetch(request)
    }

    if (!wantsOgHtml(request)) {
      return env.ASSETS.fetch(request)
    }

    const cfgPromise = fetchSiteConfig(env)
    const cfg = await cfgPromise
    const html = buildOgHtml(url.toString(), cfg)
    const headers = new Headers({
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'public, max-age=120, s-maxage=300',
    })

    if (request.method === 'HEAD') {
      return new Response(null, { headers })
    }

    return new Response(html, { headers })
  },
}
