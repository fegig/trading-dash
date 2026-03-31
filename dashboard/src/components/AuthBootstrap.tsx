import { useEffect, type ReactNode } from 'react'
import { useAuthStore } from '../stores'

/** Runs legacy session hydrate once (cookie + `_currentInfo`). */
export function AuthBootstrap({ children }: { children: ReactNode }) {
  useEffect(() => {
    useAuthStore.getState().hydrate()
  }, [])
  return children
}
