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

export const useUserStore = create<UserState>((set) => ({
  user: null,
  setUser: (u) => set({ user: u }),
}))
