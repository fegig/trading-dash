import { create } from 'zustand'
import * as settingsService from '../services/settingsService'
import type { ActivityLogRow, SettingToggle } from '../types/account'
import { useAuthStore } from './authStore'

type SettingsState = {
  preferences: SettingToggle[]
  activityLog: ActivityLogRow[]
  loading: boolean
  loaded: boolean
  loadSettings: (force?: boolean) => Promise<void>
  togglePreference: (id: string) => Promise<void>
}

export const useSettingsStore = create<SettingsState>((set, get) => ({
  preferences: [],
  activityLog: [],
  loading: false,
  loaded: false,

  loadSettings: async (force = false) => {
    if (!force && (get().loading || get().loaded)) return
    set({ loading: true })
    const [preferences, activityLog] = await Promise.all([
      settingsService.getSettingsToggles(),
      settingsService.getActivityLogs(),
    ])
    set({ preferences, activityLog, loading: false, loaded: true })
  },

  togglePreference: async (id) => {
    const current = get().preferences.find((p) => p.id === id)
    if (!current) return
    const nextEnabled = !current.enabled

    // Optimistic update
    set((state) => ({
      preferences: state.preferences.map((p) =>
        p.id === id ? { ...p, enabled: nextEnabled } : p
      ),
    }))

    const result = await settingsService.updateSettingToggle(id, nextEnabled)

    if (!result.ok) {
      // Revert on failure
      set((state) => ({
        preferences: state.preferences.map((p) =>
          p.id === id ? { ...p, enabled: !nextEnabled } : p
        ),
      }))
      return
    }

    // When 2FA toggle changes, update the cached auth user so login flow
    // reflects the new setting without requiring a full re-login
    if (id === 'two-factor-login') {
      const prev = useAuthStore.getState().user
      if (prev) {
        useAuthStore.getState().setUser({ ...prev, loginOtpEnabled: nextEnabled })
      }
    }
  },
}))
