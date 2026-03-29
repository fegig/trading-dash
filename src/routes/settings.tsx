import { useEffect, useState } from 'react'
import { useUserStore } from '../stores'
import * as userService from '../services/userService'
import { formatDateWithTime } from '../util/time'

type LogRow = { id: string; time: number; ipAddress?: string; location?: string }

export default function SettingsPage() {
  const userId = useUserStore((s) => s.user?.user_id) ?? 'demo-user'
  const [logs, setLogs] = useState<LogRow[]>([])

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      const raw = await userService.getActivityLog(userId)
      if (cancelled || !Array.isArray(raw)) return
      const mapped: LogRow[] = raw.map((r: unknown, i: number) => {
        const row = r as { id?: string; time?: number; ipAddress?: string; location?: string }
        return {
          id: String(row.id ?? i),
          time: typeof row.time === 'number' ? row.time : Math.floor(Date.now() / 1000) - i * 3600,
          ipAddress: row.ipAddress,
          location: row.location,
        }
      })
      setLogs(
        mapped.length
          ? mapped
          : [
              {
                id: '1',
                time: Math.floor(Date.now() / 1000) - 86400,
                ipAddress: '192.0.2.1',
                location: 'Demo',
              },
            ]
      )
    })()
    return () => {
      cancelled = true
    }
  }, [userId])

  return (
    <div className="p-6 max-w-4xl space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-neutral-100">Settings</h1>
        <p className="text-sm text-neutral-500 mt-2">Security preferences and session activity.</p>
      </div>

      <section className="gradient-background p-5 rounded-xl space-y-4">
        <h2 className="text-sm font-semibold text-neutral-300">Security</h2>
        <p className="text-sm text-neutral-500">
          Password change, 2FA, and API keys can plug in here. Forms are intentionally omitted until
          auth flows are finalized.
        </p>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            className="text-xs px-3 py-2 rounded-lg bg-neutral-800 text-neutral-400 cursor-not-allowed"
            disabled
          >
            Change password (soon)
          </button>
          <button
            type="button"
            className="text-xs px-3 py-2 rounded-lg bg-neutral-800 text-neutral-400 cursor-not-allowed"
            disabled
          >
            Two-factor auth (soon)
          </button>
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-neutral-400 uppercase tracking-wide">
          Activity log
        </h2>
        <div className="gradient-background p-0 rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-xs text-neutral-500 uppercase border-b border-neutral-800">
                <tr>
                  <th className="px-4 py-3 text-left font-medium">Time</th>
                  <th className="px-4 py-3 text-left font-medium">IP</th>
                  <th className="px-4 py-3 text-left font-medium">Location</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-800/80">
                {logs.map((l) => (
                  <tr key={l.id}>
                    <td className="px-4 py-3 text-neutral-300 whitespace-nowrap">
                      {formatDateWithTime(l.time)}
                    </td>
                    <td className="px-4 py-3 text-neutral-400">{l.ipAddress ?? '—'}</td>
                    <td className="px-4 py-3 text-neutral-400">{l.location ?? '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </div>
  )
}
