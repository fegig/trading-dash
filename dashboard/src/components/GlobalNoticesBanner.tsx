import { useEffect, useState } from 'react'
import {
  dismissDashboardNotice,
  getDashboardNotices,
  type DashboardNotice,
} from '../services/userService'

export default function GlobalNoticesBanner() {
  const [notices, setNotices] = useState<DashboardNotice[]>([])

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      const data = await getDashboardNotices()
      if (!cancelled) setNotices(data)
    })()
    return () => {
      cancelled = true
    }
  }, [])

  async function dismiss(id: string) {
    const ok = await dismissDashboardNotice(id)
    if (ok) setNotices((n) => n.filter((x) => x.id !== id))
  }

  if (notices.length === 0) return null

  return (
    <div className="space-y-2 mb-4" role="region" aria-label="Account notices">
      {notices.map((n) => (
        <div
          key={n.id}
          className="rounded-xl border border-amber-500/25 bg-gradient-to-r from-amber-500/10 to-neutral-900/40 px-4 py-3 text-sm"
        >
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
            <div className="min-w-0">
              <p className="font-semibold text-amber-200">{n.title}</p>
              <p className="text-neutral-300 mt-1 whitespace-pre-wrap leading-relaxed">{n.body}</p>
            </div>
            <button
              type="button"
              onClick={() => dismiss(n.id)}
              className="shrink-0 self-start px-3 py-1.5 rounded-lg text-xs font-medium bg-neutral-800 text-neutral-300 hover:text-white border border-neutral-600 transition-colors"
            >
              Dismiss
            </button>
          </div>
        </div>
      ))}
    </div>
  )
}
