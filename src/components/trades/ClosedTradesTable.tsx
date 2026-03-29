import { useEffect, useState } from 'react'
import { Link } from 'react-router'
import { useUserStore } from '../../stores'
import * as tradeService from '../../services/tradeService'
import type { ClosedTradeRow } from '../../types/trade'
import { formatDateWithTime } from '../../util/time'

function SideBadge({ side }: { side: ClosedTradeRow['option'] }) {
  const buy = side === 'buy'
  return (
    <span
      className={`text-xs font-semibold uppercase px-2 py-0.5 rounded ${
        buy ? 'bg-green-500/15 text-green-400' : 'bg-red-500/15 text-red-400'
      }`}
    >
      {side}
    </span>
  )
}

function CellClosed(t: number | 'pending') {
  if (t === 'pending') return <span className="text-amber-400/90">Pending</span>
  return <span>{formatDateWithTime(t)}</span>
}

function CellRoi(roi: string | 'pending', curr: string) {
  if (roi === 'pending') return <span className="text-amber-400/90">Pending</span>
  const n = Number(roi)
  const cls = n >= 0 ? 'text-green-400' : 'text-red-400'
  return (
    <span className={cls}>
      {roi}
      {curr}
    </span>
  )
}

type Props = {
  /** If set, only show first N rows and optional link to full page */
  limit?: number
  showViewAll?: boolean
}

export default function ClosedTradesTable({ limit, showViewAll }: Props) {
  const userId = useUserStore((s) => s.user?.user_id) ?? 'demo-user'
  const [rows, setRows] = useState<ClosedTradeRow[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      setLoading(true)
      const data = await tradeService.getClosedTrades(userId)
      if (!cancelled) {
        setRows(typeof limit === 'number' ? data.slice(0, limit) : data)
        setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [userId, limit])

  if (loading) {
    return (
      <div className="gradient-background p-4 rounded-xl animate-pulse min-h-[200px]">
        <div className="h-4 bg-neutral-800 rounded w-1/3 mb-4" />
        <div className="h-24 bg-neutral-800/80 rounded" />
      </div>
    )
  }

  if (rows.length === 0) {
    return (
      <div className="gradient-background p-8 rounded-xl text-center text-neutral-500">
        <i className="fi fi-rr-search-alt text-3xl mb-2 opacity-50" />
        <p className="text-sm">No closed orders yet</p>
      </div>
    )
  }

  return (
    <div className="gradient-background p-0 rounded-xl overflow-hidden">
      {showViewAll && (
        <div className="flex justify-end px-4 pt-3">
          <Link
            to="/trades"
            className="text-xs text-green-400 hover:text-green-300 flex items-center gap-1"
          >
            View all trades
            <i className="fi fi-rr-angle-small-right" />
          </Link>
        </div>
      )}
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className="text-xs text-neutral-500 uppercase border-b border-neutral-800">
            <tr>
              <th className="px-4 py-3 font-medium">Pair</th>
              <th className="px-4 py-3 font-medium">Side</th>
              <th className="px-4 py-3 font-medium">Opened</th>
              <th className="px-4 py-3 font-medium">Closed</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium text-right">ROI</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-800/80">
            {rows.map((info) => (
              <tr key={info.tradeId} className="hover:bg-neutral-900/40">
                <td className="px-4 py-3 font-medium text-neutral-200">{info.pair}</td>
                <td className="px-4 py-3">
                  <div className="flex flex-col gap-1">
                    <SideBadge side={info.option} />
                    <span className="text-xs text-neutral-500">
                      {info.invested}
                      {info.currency}
                    </span>
                  </div>
                </td>
                <td className="px-4 py-3 text-neutral-400 whitespace-nowrap">
                  <div>{formatDateWithTime(info.entryTime)}</div>
                  <div className="text-xs text-neutral-500">@{info.entryPrice}</div>
                </td>
                <td className="px-4 py-3 text-neutral-400 whitespace-nowrap">
                  <div>{CellClosed(info.closingTime)}</div>
                  <div className="text-xs text-neutral-500">@{info.closingPrice}</div>
                </td>
                <td className="px-4 py-3 capitalize text-neutral-300">{info.status}</td>
                <td className="px-4 py-3 text-right tabular-nums">
                  {CellRoi(info.roi, info.currency)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
