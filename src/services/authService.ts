import { authGet, authPost } from './authClient'
import { endpoints } from './endpoints'
import { convertTime } from '../util/convertTime'

export type LoginApiUser = Record<string, unknown>

export type FiatCurrency = { name?: string; symbol?: string }

export async function loginWithPassword(email: string, password: string) {
  return authPost<{ user?: LoginApiUser; token?: string }>(endpoints.user.login, {
    useremail: email,
    password,
  })
}

export async function getFiatCurrency(currencyId: number | string) {
  return authPost<{ currency?: FiatCurrency }>(endpoints.user.getFiat, { currencyId })
}

export async function sendLoginOtpEmail(mailTo: string, otpCode: string) {
  return authGet(endpoints.mailer.emailOtp(mailTo, otpCode))
}

export async function sendOtpRecord(payload: {
  userId: number | string
  messageId: string
  code: string
  time: number
  expires: number
}) {
  return authPost(endpoints.auth.sendOTP, payload)
}

export async function verifyOtp(payload: {
  userId: number | string
  messageId: string
  code: string
}) {
  return authPost(endpoints.auth.verifyOTP, payload)
}

export async function requestPasswordReset(email: string) {
  return authPost(endpoints.auth.passwordReset, { email })
}

export async function registerUser(payload: {
  userId: string
  email: string
  refBy: string | null
  /** Sent when your API supports it; ignored by older backends. */
  password?: string
}) {
  return authPost(endpoints.auth.register, payload)
}

export async function registerReferral(payload: Record<string, unknown>) {
  return authPost(endpoints.auth.regRefferal, payload)
}

export async function createAuthToken(payload: {
  userId: string
  token: string
  time: number
  expires: number
  status: string
}) {
  return authPost(endpoints.auth.createToken, payload)
}

export async function createVerifyToken(userId: number | string, token: string) {
  return authPost(endpoints.auth.createToken, { userId, token })
}

export async function sendVerificationEmail(
  mailTo: string,
  userId: number | string,
  token: string,
  userName?: string
) {
  return authGet(endpoints.mailer.verificationEmail(mailTo, userId, token, userName))
}

export async function getVerificationStatus(userId: number) {
  return authPost<{ data?: number }>(endpoints.user.getVerificationStatus, { userId })
}

export async function verifyEmailToken(token: string, userId: string) {
  return authPost<boolean>(endpoints.auth.verifyToken, { token, userId })
}

export async function updateUserVerificationStatus(status: number, userId: string) {
  return authPost<boolean>(endpoints.user.updateUserStatus, { status, userId })
}

export async function addUserBios(payload: Record<string, unknown>) {
  return authPost(endpoints.user.addBios, payload)
}

export async function listFiats() {
  return authPost<{ data?: Array<{ id: number; name: string; symbol: string }> }>(
    endpoints.user.getAllFiats,
    {}
  )
}

export async function updateUserCurrency(payload: {
  country: string
  currency_id: number
  userId: number
}) {
  return authPost(endpoints.user.updateCurrency, payload)
}

export async function addAdminWallet(userId: number) {
  return authPost(endpoints.user.addAdminWallet, { userId })
}

/** Fire-and-forget login notification when `OMS__FEI` device payload exists. */
export function notifyLoginFromDeviceStorage(
  user: { email?: unknown; user_id?: unknown }
): void {
  const raw = localStorage.getItem('OMS__FEI')
  if (!raw || user.email == null || user.user_id == null) return
  try {
    const device = JSON.parse(raw) as {
      client?: { name?: string }
      device?: { type?: string }
      os?: { name?: string; version?: string; platform?: string }
    }
    const browser = device.client?.name ?? ''
    const browserType = device.device?.type ?? ''
    const osName = device.os?.name ?? ''
    const osVersion = device.os?.version ?? ''
    const osPlatform = device.os?.platform ?? ''
    const loginDevice = `${browser} for ${browserType} on ${osName} ${osVersion} ${osPlatform}`
    const t = Math.floor(Date.now() / 1000)
    const timeDate = convertTime(t)
    void authGet(
      endpoints.mailer.loginNotification(String(user.email), user.user_id, loginDevice, timeDate)
    )
  } catch {
    /* ignore */
  }
}
