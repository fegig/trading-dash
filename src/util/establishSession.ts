import type { NavigateFunction } from 'react-router'
import * as authService from '@/services/authService'
import { useAuthStore, useCurrencyStore } from '@/stores'
import type { ApiUser } from '@/stores'

/**
 * Persist session and send the user to the dashboard.
 * Call after a successful credential check (e.g. login API returned a user).
 */
export async function establishSessionAndNavigate(
  user: ApiUser,
  navigate: NavigateFunction,
  options?: { token?: string; to?: string }
): Promise<void> {
  const merged: ApiUser = options?.token ? { ...user, token: options.token } : user
  useAuthStore.getState().login(merged)
  authService.notifyLoginFromDeviceStorage(merged)

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

  navigate(options?.to ?? '/dashboard', { replace: true })
}
