import { mockActivityLogs, mockSettingsToggles } from '../data/account'
import type { ActivityLogRow, SettingToggle } from '../types/account'
import { get } from '../util/request'
import { endpoints } from './endpoints'

export async function getSettingsToggles(): Promise<SettingToggle[]> {
  try {
    const data = await get(endpoints.settings.toggles)
    if (Array.isArray(data) && data.length > 0) return data as SettingToggle[]
  } catch {
    /* mock */
  }
  return mockSettingsToggles.map((toggle) => ({ ...toggle }))
}

export async function getActivityLogs(): Promise<ActivityLogRow[]> {
  try {
    const data = await get(endpoints.settings.activityLogs)
    if (Array.isArray(data) && data.length > 0) return data as ActivityLogRow[]
  } catch {
    /* mock */
  }
  return mockActivityLogs.map((log) => ({ ...log }))
}
