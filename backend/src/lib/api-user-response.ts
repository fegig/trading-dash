import { eq } from 'drizzle-orm'
import type { AppVariables } from '../types/env'
import * as schema from '../db/schema'

export async function fiatMetaForUser(
  db: AppVariables['db'],
  currencyId: number | null
): Promise<{ code: string; name: string } | null> {
  if (currencyId == null) return null
  const [r] = await db
    .select({ code: schema.fiatCurrencies.code, name: schema.fiatCurrencies.name })
    .from(schema.fiatCurrencies)
    .where(eq(schema.fiatCurrencies.id, currencyId))
    .limit(1)
  if (!r) return null
  const code =
    r.code && r.code.trim()
      ? r.code.trim().toUpperCase()
      : r.name.substring(0, 3).toUpperCase()
  return { code, name: r.name }
}

export function apiUserRow(
  u: {
    publicId: string
    email: string
    verificationStatus: number
    currencyId: number | null
    bios?: unknown
  },
  fiat?: { code: string; name: string } | null
) {
  const b =
    u.bios && typeof u.bios === 'object' && !Array.isArray(u.bios)
      ? (u.bios as Record<string, unknown>)
      : {}
  const phone =
    typeof b.phone === 'string' && b.phone.trim()
      ? b.phone.trim()
      : typeof b.phoneNumber === 'string' && b.phoneNumber.trim()
        ? b.phoneNumber.trim()
        : ''
  return {
    user_id: u.publicId,
    email: u.email,
    verificationStatus: String(u.verificationStatus) as '0' | '1' | '2' | '3',
    currency_id: u.currencyId ?? '',
    firstName: typeof b.firstName === 'string' ? b.firstName : '',
    lastName: typeof b.lastName === 'string' ? b.lastName : '',
    phone,
    country: typeof b.country === 'string' ? b.country : '',
    loginOtpEnabled: b.loginOtpEnabled === true,
    currency_code: fiat?.code ?? '',
    currency_name: fiat?.name ?? '',
  }
}
