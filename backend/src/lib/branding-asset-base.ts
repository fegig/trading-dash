import type { Env } from '../types/env'

/**
 * Origin for R2-backed URLs in emails (`/public/branding/*`). Must resolve to this Worker, not the SPA.
 * Resend and other clients fetch this URL; `FRONTEND_URL` alone will 404 if it points at Vite/dashboard.
 */
export function resolveBrandingAssetBaseForEmail(env: Env): string {
  const raw = env.BRANDING_PUBLIC_URL?.trim() || env.API_PUBLIC_URL?.trim() || ''
  return raw.replace(/\/$/, '')
}
