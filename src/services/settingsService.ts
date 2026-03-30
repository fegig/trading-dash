import { mockActivityLogs, mockSettingsToggles } from '../data/account'
import type { ActivityLogRow, SettingToggle } from '../types/account'

export async function getSettingsToggles(): Promise<SettingToggle[]> {
  return mockSettingsToggles.map((toggle) => ({ ...toggle }))
}

export async function getActivityLogs(): Promise<ActivityLogRow[]> {
  return mockActivityLogs.map((log) => ({ ...log }))
}
