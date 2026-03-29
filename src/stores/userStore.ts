import { create } from 'zustand'

export type VerificationStatus = '0' | '1' | '2' | '3'

export type UserProfile = {
  user_id: string
  firstName: string
  lastName: string
  lastLog?: number
  verificationStatus: VerificationStatus
}

type UserState = {
  user: UserProfile | null
  setUser: (u: UserProfile | null) => void
}

/** Demo user when API is not configured; replace via userService + setUser */
const demoUser: UserProfile = {
  user_id: 'demo-user',
  firstName: 'Trader',
  lastName: 'Demo',
  lastLog: Math.floor(Date.now() / 1000),
  verificationStatus: '3',
}

export const useUserStore = create<UserState>((set) => ({
  user: demoUser,
  setUser: (u) => set({ user: u }),
}))
