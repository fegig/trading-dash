import type { Env } from '../types/env'
import type { AppVariables } from '../types/env'
import type { EmailBranding } from '../email/templates'
import { emailBrandingFromEnv, mergeEmailBranding } from '../email/templates'
import { resolveBrandingAssetBaseForEmail } from './branding-asset-base'
import { getPlatformSettingsRow } from './platform-settings'

type Db = AppVariables['db']

/** Absolute URLs for transactional email layout + app name from DB. */
export async function getEmailBranding(env: Env, db: Db): Promise<EmailBranding> {
  const row = await getPlatformSettingsRow(db)
  const assetBase = resolveBrandingAssetBaseForEmail(env)
  const siteName = row?.siteName?.trim()
  const appName = siteName && siteName.length > 0 ? siteName : undefined

  let logoUrl: string | undefined
  if (row?.emailLogoR2Key && assetBase.length > 0) {
    logoUrl = `${assetBase}/public/branding/email-logo`
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
