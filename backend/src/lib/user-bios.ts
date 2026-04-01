import { eq } from 'drizzle-orm'
import type { InferSelectModel } from 'drizzle-orm'
import type { AppVariables } from '../types/env'
import * as schema from '../db/schema'

type Db = AppVariables['db']

export type UserBiosRow = InferSelectModel<typeof schema.userBios>

export type UserBiosPatch = Partial<{
  firstName: string
  lastName: string
  phone: string
  country: string
  loginOtpEnabled: boolean
  onboardingWelcomeSent: boolean
}>

function mergeFields(existing: UserBiosRow | undefined, patch: UserBiosPatch) {
  return {
    firstName: patch.firstName !== undefined ? patch.firstName : (existing?.firstName ?? ''),
    lastName: patch.lastName !== undefined ? patch.lastName : (existing?.lastName ?? ''),
    phone: patch.phone !== undefined ? patch.phone : (existing?.phone ?? ''),
    country: patch.country !== undefined ? patch.country : (existing?.country ?? ''),
    loginOtpEnabled:
      patch.loginOtpEnabled !== undefined ? patch.loginOtpEnabled : (existing?.loginOtpEnabled ?? false),
    onboardingWelcomeSent:
      patch.onboardingWelcomeSent !== undefined
        ? patch.onboardingWelcomeSent
        : (existing?.onboardingWelcomeSent ?? false),
  }
}

/** Map `/user/addBios` body keys into typed patch (ignores unknown keys). */
export function patchFromAddBiosBody(body: Record<string, unknown>): UserBiosPatch {
  const p: UserBiosPatch = {}
  if (typeof body.firstName === 'string') p.firstName = body.firstName
  if (typeof body.lastName === 'string') p.lastName = body.lastName
  const phoneRaw =
    typeof body.phone === 'string'
      ? body.phone
      : typeof body.phoneNumber === 'string'
        ? body.phoneNumber
        : undefined
  if (phoneRaw !== undefined) p.phone = phoneRaw.replace(/\s/g, '')
  if (typeof body.country === 'string') p.country = body.country
  return p
}

export async function getUserBiosRow(db: Db, userId: number): Promise<UserBiosRow | undefined> {
  const [row] = await db
    .select()
    .from(schema.userBios)
    .where(eq(schema.userBios.userId, userId))
    .limit(1)
  return row
}

/** Shape expected by `apiUserRow` / legacy clients (`phone` + `phoneNumber`). */
export function biosSnapshotForApi(row: UserBiosRow | undefined | null): Record<string, unknown> {
  if (!row) return {}
  return {
    firstName: row.firstName,
    lastName: row.lastName,
    phone: row.phone,
    phoneNumber: row.phone,
    country: row.country,
    loginOtpEnabled: row.loginOtpEnabled,
    onboardingWelcomeSent: row.onboardingWelcomeSent,
  }
}

export async function mergeUserBiosFields(db: Db, userId: number, patch: UserBiosPatch): Promise<void> {
  const existing = await getUserBiosRow(db, userId)
  const next = mergeFields(existing, patch)
  const now = new Date()
  if (!existing) {
    await db.insert(schema.userBios).values({
      userId,
      ...next,
      createdAt: now,
      updatedAt: now,
    })
    return
  }
  await db
    .update(schema.userBios)
    .set({
      ...next,
      updatedAt: now,
    })
    .where(eq(schema.userBios.userId, userId))
}
