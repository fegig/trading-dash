const APP_ENV = import.meta.env.VITE_APP_ENV ?? 'development'
const APP_URL = import.meta.env.VITE_APP_URL ?? ''
const COOKIE_DOMAIN = import.meta.env.VITE_COOKIE_DOMAIN as string | undefined

export function sessionCookieAttributes(): Cookies.CookieAttributes {
  const isProd = APP_ENV === 'production'
  const attrs: Cookies.CookieAttributes = {
    expires: 7,
    path: '/',
    secure: isProd,
    sameSite: 'lax',
  }
  if (isProd && COOKIE_DOMAIN) {
    attrs.domain = COOKIE_DOMAIN
  } else if (isProd && APP_URL && !APP_URL.includes('localhost')) {
    try {
      const host = new URL(APP_URL).hostname
      if (host && host !== 'localhost') attrs.domain = `.${host.replace(/^www\./, '')}`
    } catch {
      /* ignore */
    }
  }
  return attrs
}
