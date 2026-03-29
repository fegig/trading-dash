import { create } from 'zustand'
import Cookies from 'js-cookie'

type AuthState = {
  token: string | null
  setToken: (t: string | null) => void
  logout: () => void
}

export const useAuthStore = create<AuthState>((set) => ({
  token: Cookies.get('__token') ?? null,
  setToken: (t) => {
    if (t) Cookies.set('__token', t, { sameSite: 'strict' })
    else Cookies.remove('__token')
    set({ token: t })
  },
  logout: () => {
    Cookies.remove('__token')
    Cookies.remove('__isLoggedIn')
    set({ token: null })
  },
}))
