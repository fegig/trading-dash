import type { ActivityLogRow, SettingToggle } from '../types/account'
import { get, update } from '../util/request'
import { endpoints } from './endpoints'

export async function getSettingsToggles(): Promise<SettingToggle[]> {
  const data = await get(endpoints.settings.toggles)
  return Array.isArray(data) ? (data as SettingToggle[]) : []
}

export async function updateSettingToggle(
  toggleId: string,
  enabled: boolean
): Promise<{ ok: boolean; error?: string }> {
  try {
    await update(endpoints.settings.updateToggle(toggleId), { enabled })
    return { ok: true }
  } catch {
    return { ok: false, error: 'Could not save setting. Try again.' }
  }
}

export async function getActivityLogs(): Promise<ActivityLogRow[]> {
  const data = await get(endpoints.settings.activityLogs)
  return Array.isArray(data) ? (data as ActivityLogRow[]) : []
}
