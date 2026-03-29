import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router'
import { useUserStore } from '../stores'
import * as tradeService from '../services/tradeService'
import type { ClosedTradeRow } from '../types/trade'
import { formatDateWithTime } from '../util/time'

const PAGE_SIZE = 10

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

export default function AllTradesPage() {
  const userId = useUserStore((s) => s.user?.user_id) ?? 'demo-user'
  const [rows, setRows] = useState<ClosedTradeRow[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(0)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      setLoading(true)
      const data = await tradeService.getClosedTrades(userId)
      console.log(data)
      if (!cancelled) {
        setRows(data)
        setPage(0)
        setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [userId])

  const totalPages = Math.max(1, Math.ceil(rows.length / PAGE_SIZE))
  const pageIndex = Math.min(page, totalPages - 1)
  const pageRows = useMemo(() => {
    const start = pageIndex * PAGE_SIZE
    return rows.slice(start, start + PAGE_SIZE)
  }, [rows, pageIndex])

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-neutral-100 tracking-tight">All trades</h1>
          <p className="text-sm text-neutral-500 mt-1">Full history of closed positions.</p>
        </div>
        <Link
          to="/live-trading"
          className="text-sm text-neutral-400 hover:text-green-400 flex items-center gap-1"
        >
          <i className="fi fi-rr-angle-small-left" />
          Back to Live Trading
        </Link>
      </div>

      {loading ? (
        <div className="gradient-background p-12 rounded-xl animate-pulse min-h-[320px]" />
      ) : rows.length === 0 ? (
        <div className="gradient-background p-12 rounded-xl text-center text-neutral-500">
          <i className="fi fi-rr-search-alt text-3xl mb-3 opacity-50" />
          <p className="text-sm">No closed trades to show yet.</p>
        </div>
      ) : (
        <div className="gradient-background p-0 rounded-xl overflow-hidden">
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
                {pageRows.map((info) => (
                  <tr key={info.tradeId} className="hover:bg-neutral-900/40">
                    <td className="px-4 py-3 font-medium text-neutral-200">{info.pair}</td>
                    <td className="px-4 py-3">
                      <SideBadge side={info.option} />
                    </td>
                    <td className="px-4 py-3 text-neutral-400 whitespace-nowrap">
                      {formatDateWithTime(info.entryTime)}
                    </td>
                    <td className="px-4 py-3 text-neutral-400 whitespace-nowrap">
                      {info.closingTime === 'pending'
                        ? 'Pending'
                        : formatDateWithTime(info.closingTime)}
                    </td>
                    <td className="px-4 py-3 capitalize text-neutral-300">{info.status}</td>
                    <td className="px-4 py-3 text-right tabular-nums">
                      {info.roi === 'pending' ? (
                        <span className="text-amber-400/90">Pending</span>
                      ) : (
                        <span
                          className={
                            Number(info.roi) >= 0 ? 'text-green-400' : 'text-red-400'
                          }
                        >
                          {info.roi}
                          {info.currency}
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {rows.length > PAGE_SIZE && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-neutral-800 text-sm text-neutral-400">
              <span>
                Page {pageIndex + 1} of {totalPages}
              </span>
              <div className="flex gap-2">
                <button
                  type="button"
                  disabled={pageIndex === 0}
                  onClick={() => setPage(pageIndex - 1)}
                  className="px-3 py-1 rounded-lg gradient-background disabled:opacity-40"
                >
                  Prev
                </button>
                <button
                  type="button"
                  disabled={pageIndex >= totalPages - 1}
                  onClick={() => setPage(pageIndex + 1)}
                  className="px-3 py-1 rounded-lg gradient-background disabled:opacity-40"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
