import { create } from 'zustand'
import Cookies from 'js-cookie'
import type { UserProfile, VerificationStatus } from './userStore'
import { useUserStore } from './userStore'
import { useWalletStore } from './walletStore'

const USER_KEY = '_currentInfo'
const COOKIE_KEY = '__isLoggedIn'

export type ApiUser = Record<string, unknown> & {
  user_id?: number | string
  email?: string
  firstName?: string | null
  lastName?: string | null
  verificationStatus?: string
  lastLog?: number
  token?: string
  role?: string
}

function toProfile(u: ApiUser): UserProfile {
  const vs = u.verificationStatus
  const verificationStatus: VerificationStatus =
    vs === '0' || vs === '1' || vs === '2' || vs === '3' ? vs : '0'
  return {
    user_id: String(u.user_id ?? ''),
    firstName: typeof u.firstName === 'string' ? u.firstName : '',
    lastName: typeof u.lastName === 'string' ? u.lastName : '',
    lastLog: typeof u.lastLog === 'number' ? u.lastLog : undefined,
    verificationStatus,
  }
}

export type AuthState = {
  isLoggedIn: boolean
  user: ApiUser | null
  hydrated: boolean
  hydrate: () => void
  login: (user: ApiUser) => void
  setUser: (user: ApiUser | null) => void
  logout: () => void
}

export const useAuthStore = create<AuthState>((set) => ({
  isLoggedIn: false,
  user: null,
  hydrated: false,

  hydrate: () => {
    const check = Cookies.get(COOKIE_KEY)
    const userStr = localStorage.getItem(USER_KEY)
    if (check && userStr) {
      try {
        const user = JSON.parse(userStr) as ApiUser
        set({ isLoggedIn: true, user, hydrated: true })
        useUserStore.getState().setUser(toProfile(user))
      } catch {
        set({ isLoggedIn: false, user: null, hydrated: true })
        useUserStore.getState().setUser(null)
      }
    } else {
      set({ isLoggedIn: false, user: null, hydrated: true })
      useUserStore.getState().setUser(null)
    }
  },

  login: (user) => {
    Cookies.set(COOKIE_KEY, 'true', { expires: 7, path: '/', sameSite: 'lax' })
    localStorage.setItem(USER_KEY, JSON.stringify(user))
    if (typeof user.token === 'string' && user.token.length > 0) {
      localStorage.setItem('token', user.token)
    }
    set({ isLoggedIn: true, user })
    useUserStore.getState().setUser(toProfile(user))
  },

  setUser: (user) => {
    if (user) {
      localStorage.setItem(USER_KEY, JSON.stringify(user))
      set({ user })
      useUserStore.getState().setUser(toProfile(user))
    }
  },

  logout: () => {
    Cookies.remove(COOKIE_KEY, { path: '/' })
    Cookies.remove('__dash', { path: '/' })
    Cookies.remove('__token', { path: '/' })
    localStorage.removeItem(USER_KEY)
    localStorage.removeItem('token')
    localStorage.removeItem('OMS__CUR')
    localStorage.removeItem('OMS__FEI')
    set({ isLoggedIn: false, user: null })
    useUserStore.getState().setUser(null)
    useWalletStore.setState({
      assets: [],
      transactions: [],
      loaded: false,
      displayCurrency: { code: 'USD', name: 'US Dollar', usdPerUnit: 1 },
    })
  },
}))
