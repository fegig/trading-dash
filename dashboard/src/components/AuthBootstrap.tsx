import { useEffect, type ReactNode } from 'react'
import * as authService from '../services/authService'
import { useAuthStore } from '../stores'
import type { ApiUser } from '../stores'

/** Hydrates auth store from cookie + stored session snapshot on load. */
export function AuthBootstrap({ children }: { children: ReactNode }) {
  useEffect(() => {
    useAuthStore.getState().hydrate()
    void (async () => {
      if (!localStorage.getItem('token')) return
      try {
        const data = await authService.fetchCurrentUserProfile()
        const u = data?.user
        if (!u || typeof u !== 'object') return
        const prev = useAuthStore.getState().user
        const merged: ApiUser = {
          ...(prev ?? {}),
          ...u,
          token: typeof prev?.token === 'string' ? prev.token : undefined,
        }
        useAuthStore.getState().setUser(merged)
      } catch {
        /* offline or expired token */
      }
    })()
  }, [])
  return children
}
