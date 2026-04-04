import type { Env } from '../types/env'
import type { AppVariables } from '../types/env'
import type { EmailBranding } from '../email/templates'
import { emailBrandingFromEnv, mergeEmailBranding } from '../email/templates'
import { getPlatformSettingsRow } from './platform-settings'

type Db = AppVariables['db']

function brandingPublicBase(env: Env): string {
  const raw = env.BRANDING_PUBLIC_URL?.trim() || env.FRONTEND_URL?.trim() || ''
  return raw.replace(/\/$/, '')
}

/** Absolute URLs for transactional email layout + app name from DB. */
export async function getEmailBranding(env: Env, db: Db): Promise<EmailBranding> {
  const row = await getPlatformSettingsRow(db)
  const base = brandingPublicBase(env)
  const siteName = row?.siteName?.trim()
  const appName = siteName && siteName.length > 0 ? siteName : undefined

  let logoUrl: string | undefined
  if (row?.emailLogoR2Key && base.length > 0) {
    logoUrl = `${base}/public/branding/email-logo`
  }

  const brandBaseUrl = env.FRONTEND_URL?.trim().replace(/\/$/, '') || undefined

  return {
    appName,
    brandBaseUrl,
    logoUrl,
  }
}

/** DB-driven branding merged with `EMAIL_LOGO_URL` / `FRONTEND_URL` fallbacks. */
export async function getTransactionalEmailBranding(env: Env, db: Db): Promise<EmailBranding> {
  const dbB = await getEmailBranding(env, db)
  const envB = emailBrandingFromEnv(env)
  return mergeEmailBranding(dbB, envB)
}
