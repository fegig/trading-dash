import { useEffect, type ReactNode } from 'react'
import { useAuthStore } from '../stores'

/** Hydrates auth store from cookie + stored session snapshot on load. */
export function AuthBootstrap({ children }: { children: ReactNode }) {
  useEffect(() => {
    useAuthStore.getState().hydrate()
  }, [])
  return children
}
