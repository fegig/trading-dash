import { create } from 'zustand'
import * as settingsService from '../services/settingsService'
import type { ActivityLogRow, SettingToggle } from '../types/account'

type SettingsState = {
  preferences: SettingToggle[]
  activityLog: ActivityLogRow[]
  loading: boolean
  loaded: boolean
  loadSettings: (force?: boolean) => Promise<void>
  togglePreference: (id: string) => void
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
  togglePreference: (id) =>
    set((state) => ({
      preferences: state.preferences.map((preference) =>
        preference.id === id ? { ...preference, enabled: !preference.enabled } : preference
      ),
    })),
}))
