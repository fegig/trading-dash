/** Fixed R2 object keys in `SITE_ASSETS` for site UI and email templates. */
export const BRANDING_SITE_R2_KEY = 'branding/site'
export const BRANDING_EMAIL_R2_KEY = 'branding/email'
export const BRANDING_FAVICON_R2_KEY = 'branding/favicon'

export const BRANDING_LOGO_MAX_BYTES = 2 * 1024 * 1024
export const BRANDING_FAVICON_MAX_BYTES = 512 * 1024

export const BRANDING_ALLOWED_MIME = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'image/svg+xml',
])

/** Browser tab icon — ICO, PNG, SVG, etc. */
export const FAVICON_ALLOWED_MIME = new Set([
  'image/x-icon',
  'image/vnd.microsoft.icon',
  'image/png',
  'image/svg+xml',
  'image/gif',
  'image/jpeg',
  'image/webp',
])
