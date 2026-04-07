/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_URL?: string
  readonly VITE_API_KEY?: string
  readonly VITE_APP_URL?: string
  readonly VITE_APP_ENV?: string
  readonly VITE_COOKIE_DOMAIN?: string
  readonly VITE_WS_URL?: string
  /** Fallback site name when `/public/site-config` has no `siteName` (SPA + meta tags). */
  readonly VITE_SITE_NAME_FALLBACK?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
