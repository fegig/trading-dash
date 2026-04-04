import { eq, sql } from 'drizzle-orm'
import type { AppVariables } from '../types/env'
import * as schema from '../db/schema'

type Db = AppVariables['db']

export const PLATFORM_SETTINGS_ID = 1

export async function getPlatformSettingsRow(db: Db) {
  const [row] = await db
    .select()
    .from(schema.platformSettings)
    .where(eq(schema.platformSettings.id, PLATFORM_SETTINGS_ID))
    .limit(1)
  return row ?? null
}

export async function ensurePlatformSettingsRow(db: Db): Promise<typeof schema.platformSettings.$inferSelect> {
  const existing = await getPlatformSettingsRow(db)
  if (existing) return existing
  const now = Math.floor(Date.now() / 1000)
  await db.insert(schema.platformSettings).values({
    id: PLATFORM_SETTINGS_ID,
    siteName: '',
    supportEmail: '',
    supportPhone: '',
    siteLogoR2Key: null,
    emailLogoR2Key: null,
    ogTitle: '',
    ogDescription: '',
    faviconR2Key: null,
    updatedAt: now,
  })
  const [row] = await db
    .select()
    .from(schema.platformSettings)
    .where(eq(schema.platformSettings.id, PLATFORM_SETTINGS_ID))
    .limit(1)
  return row!
}

export async function updatePlatformSettingsText(
  db: Db,
  patch: {
    siteName?: string
    supportEmail?: string
    supportPhone?: string
    ogTitle?: string
    ogDescription?: string
  }
): Promise<void> {
  const now = Math.floor(Date.now() / 1000)
  await db
    .update(schema.platformSettings)
    .set({
      ...(patch.siteName !== undefined ? { siteName: patch.siteName } : {}),
      ...(patch.supportEmail !== undefined ? { supportEmail: patch.supportEmail } : {}),
      ...(patch.supportPhone !== undefined ? { supportPhone: patch.supportPhone } : {}),
      ...(patch.ogTitle !== undefined ? { ogTitle: patch.ogTitle } : {}),
      ...(patch.ogDescription !== undefined ? { ogDescription: patch.ogDescription } : {}),
      updatedAt: now,
    })
    .where(eq(schema.platformSettings.id, PLATFORM_SETTINGS_ID))
}

export async function setSiteLogoKey(db: Db, key: string | null): Promise<void> {
  const now = Math.floor(Date.now() / 1000)
  await db
    .update(schema.platformSettings)
    .set({ siteLogoR2Key: key, updatedAt: now })
    .where(eq(schema.platformSettings.id, PLATFORM_SETTINGS_ID))
}

export async function setEmailLogoKey(db: Db, key: string | null): Promise<void> {
  const now = Math.floor(Date.now() / 1000)
  await db
    .update(schema.platformSettings)
    .set({ emailLogoR2Key: key, updatedAt: now })
    .where(eq(schema.platformSettings.id, PLATFORM_SETTINGS_ID))
}

export async function setFaviconKey(db: Db, key: string | null): Promise<void> {
  const now = Math.floor(Date.now() / 1000)
  await db
    .update(schema.platformSettings)
    .set({ faviconR2Key: key, updatedAt: now })
    .where(eq(schema.platformSettings.id, PLATFORM_SETTINGS_ID))
}

/** For INSERT IGNORE style seed in scripts — optional. */
export async function countPlatformSettings(db: Db): Promise<number> {
  const [r] = await db.select({ n: sql<number>`count(*)` }).from(schema.platformSettings)
  return Number(r?.n ?? 0)
}
