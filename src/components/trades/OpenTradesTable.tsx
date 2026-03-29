import { useEffect, useState } from 'react'
import { useUserStore } from '../../stores'
import * as tradeService from '../../services/tradeService'
import type { OpenTradeRow } from '../../types/trade'
import { formatDateWithTime } from '../../util/time'

function SideBadge({ side }: { side: OpenTradeRow['option'] }) {
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

export default function OpenTradesTable({ limit = 8 }: { limit?: number }) {
  const userId = useUserStore((s) => s.user?.user_id) ?? 'demo-user'
  const [rows, setRows] = useState<OpenTradeRow[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      setLoading(true)
      const data = await tradeService.getOpenTrades(userId)
      if (!cancelled) {
        setRows(data.slice(0, limit))
        setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [userId, limit])

  const onClose = async (tradeId: string) => {
    await tradeService.closeTrade(tradeId)
    setRows((prev) => prev.filter((r) => r.tradeId !== tradeId))
  }

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
        <p className="text-sm">No open orders</p>
      </div>
    )
  }

  return (
    <div className="gradient-background p-0 rounded-xl overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className="text-xs text-neutral-500 uppercase border-b border-neutral-800">
            <tr>
              <th className="px-4 py-3 font-medium">Pair</th>
              <th className="px-4 py-3 font-medium">Side</th>
              <th className="px-4 py-3 font-medium">Opened</th>
              <th className="px-4 py-3 font-medium">Invested</th>
              <th className="px-4 py-3 font-medium text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-800/80">
            {rows.map((info) => (
              <tr key={info.tradeId} className="hover:bg-neutral-900/40">
                <td className="px-4 py-3 font-medium text-neutral-200">{info.pair}</td>
                <td className="px-4 py-3">
                  <div className="flex flex-col gap-1">
                    <SideBadge side={info.option} />
                    <span className="text-xs text-neutral-500">@{info.entryPrice}</span>
                  </div>
                </td>
                <td className="px-4 py-3 text-neutral-400 whitespace-nowrap">
                  {formatDateWithTime(info.entryTime)}
                </td>
                <td className="px-4 py-3 tabular-nums">
                  {info.invested}
                  {info.currency}
                </td>
                <td className="px-4 py-3 text-right">
                  <button
                    type="button"
                    onClick={() => onClose(info.tradeId)}
                    className="text-xs px-3 py-1.5 rounded-lg bg-amber-500/15 text-amber-400 hover:bg-amber-500/25 transition-colors"
                  >
                    Close
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
