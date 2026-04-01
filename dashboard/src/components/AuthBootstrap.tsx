import { useEffect, type ReactNode } from 'react'
import * as authService from '../services/authService'
import { useAuthStore } from '../stores'
import type { ApiUser } from '../stores'

/** Prefer non-empty fields already in the client snapshot so `/me` never wipes onboarding data on a race. */
function mergeProfileFromMe(prev: ApiUser | null, u: Record<string, unknown>): ApiUser {
  const keys = ['firstName', 'lastName', 'phone', 'country', 'currency_id'] as const
  const out = { ...(prev ?? {}), ...u } as ApiUser
  for (const k of keys) {
    const incoming = u[k as string]
    const previous = prev?.[k as keyof ApiUser]
    const incomingEmpty =
      incoming == null ||
      incoming === '' ||
      (typeof incoming === 'string' && incoming.trim() === '')
    const previousNonempty =
      (typeof previous === 'string' && previous.trim() !== '') ||
      (typeof previous === 'number' && !Number.isNaN(previous))
    if (incomingEmpty && previousNonempty) {
      ;(out as Record<string, unknown>)[k] = previous as string | number
    }
  }
  if (typeof prev?.token === 'string' && prev.token.length > 0) {
    out.token = prev.token
  }
  return out
}

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
        useAuthStore.getState().setUser(mergeProfileFromMe(prev, u as Record<string, unknown>))
      } catch {
        /* offline or expired token */
      }
    })()
  }, [])
  return children
}
