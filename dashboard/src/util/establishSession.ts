import type { NavigateFunction } from 'react-router'
import { toast } from 'react-toastify'
import * as authService from '@/services/authService'
import { useAuthStore, useCurrencyStore } from '@/stores'
import type { ApiUser } from '@/stores'

/**
 * Client session is still **Bearer-first**: `login()` stores the token in `localStorage` and
 * `authClient` sends `Authorization: Bearer` on auth API calls.
 *
 * When `requestWebSession` is true, we also call `POST /user/ensureWebSession` so the Worker can
 * set an **HttpOnly session cookie** (in addition to Bearer). That helps cookie-only flows and
 * matches what password login already returns. Bearer is not removed or replaced.
 */
export async function startSession(
  user: ApiUser,
  navigate: NavigateFunction,
  options?: { token?: string; to?: string; welcomeToast?: boolean; requestWebSession?: boolean }
): Promise<void> {
  const merged: ApiUser = options?.token ? { ...user, token: options.token } : user
  useAuthStore.getState().login(merged)
  authService.notifyLoginFromDeviceStorage(merged)

  if (options?.requestWebSession) {
    try {
      await authService.ensureWebSession()
    } catch {
      /* cookie is best-effort; Bearer still works */
    }
  }

  const cid = user.currency_id
  if (cid != null && cid !== '') {
    try {
      const res = await authService.getFiatCurrency(cid as number | string)
      const curr = res.data?.currency
      if (curr?.symbol) {
        useCurrencyStore.getState().setCurrency({
          name: curr.name ?? 'USD',
          symbol: curr.symbol.substring(1, 2),
        })
      }
    } catch {
      /* optional enrichment */
    }
  }

  if (options?.welcomeToast) {
    try {
      await authService.notifyOnboardingWelcome()
    } catch {
      /* welcome email is best-effort */
    }
    toast.success('Welcome to your workspace. You are signed in.')
  }

  navigate(options?.to ?? '/dashboard', { replace: true })
}
