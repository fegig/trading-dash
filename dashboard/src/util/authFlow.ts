import * as authService from '@/services/authService'
import type { ApiUser } from '@/stores/authStore'
import { getRandomIntDigits, getRandomString } from '@/util/random'

/** True when backend marks login OTP / 2FA as required (supports common field names). */
export function userRequiresTwoFactorLogin(u: Record<string, unknown>): boolean {
  const keys = [
    u.twoFactorLogin,
    u.two_factor_login,
    u.loginOtpEnabled,
    u.login_otp_enabled,
    u.requireLoginOtp,
    u.require_login_otp,
    u.otpLogin,
    u.otp_login,
    u.twoFactorEnabled,
    u.two_factor_enabled,
  ]
  return keys.some((v) => v === true || v === 1 || v === '1' || v === 'true' || v === 'yes')
}

/**
 * Profile / workspace setup still needed after email verification
 * (name, phone, country, default currency).
 * Admins are always exempt — they skip onboarding entirely.
 */
export function userNeedsOnboarding(u: Record<string, unknown>): boolean {
  if (u.role === 'admin') return false
  if (u.verificationStatus === '0') return false

  const fn = u.firstName
  const ln = u.lastName
  const noName =
    fn == null ||
    ln == null ||
    (typeof fn === 'string' && fn.trim() === '') ||
    (typeof ln === 'string' && ln.trim() === '')

  const phone = u.phone
  const noPhone = phone == null || (typeof phone === 'string' && phone.trim() === '')

  const country = u.country
  const noCountry = country == null || (typeof country === 'string' && country.trim() === '')

  const cid = u.currency_id
  const noCurrency = cid == null || cid === ''

  return noName || noPhone || noCountry || noCurrency
}

export async function sendLoginOtpChallenge(user: {
  user_id?: unknown
  email?: unknown
}): Promise<string> {
  const userId = user.user_id
  const mail = user.email
  if (userId == null || mail == null) {
    throw new Error('Missing user for OTP challenge')
  }
  const otp = getRandomIntDigits(6)
  await authService.sendLoginOtpEmail(String(mail), otp)
  const time = Math.floor(Date.now() / 1000)
  const expires = time + 600
  const messageId = getRandomString(36)
  await authService.sendOtpRecord({
    userId: userId as number | string,
    messageId,
    code: otp,
    time,
    expires,
  })
  return messageId
}

export function splitDisplayName(displayName: string): { firstName: string; lastName: string } {
  const t = displayName.trim()
  const i = t.indexOf(' ')
  if (i === -1) return { firstName: t, lastName: '' }
  return { firstName: t.slice(0, i).trim(), lastName: t.slice(i + 1).trim() }
}

export type PendingOtpPayload = {
  user: ApiUser
  messageId: string
  token?: string
  /** After OTP, navigate here instead of `/dashboard`. */
  redirectTo?: string
  /** When set, send onboarding welcome email + toast after OTP (same as post-onboarding dashboard entry). */
  welcomeToast?: boolean
}

/** SessionStorage key for OTP step (avoids huge history state). */
const PENDING_OTP_KEY = 'bt_pending_otp'

export function persistPendingOtp(payload: PendingOtpPayload): void {
  try {
    sessionStorage.setItem(PENDING_OTP_KEY, JSON.stringify(payload))
  } catch {
    /* ignore */
  }
}

export function readPendingOtp(): PendingOtpPayload | null {
  try {
    const raw = sessionStorage.getItem(PENDING_OTP_KEY)
    if (!raw) return null
    return JSON.parse(raw) as PendingOtpPayload
  } catch {
    return null
  }
}

export function clearPendingOtp(): void {
  try {
    sessionStorage.removeItem(PENDING_OTP_KEY)
  } catch {
    /* ignore */
  }
}
