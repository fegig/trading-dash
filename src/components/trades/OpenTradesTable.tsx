import { useEffect, useMemo } from 'react'
import { useShallow } from 'zustand/react/shallow'
import GradientBadge from '../common/GradientBadge'
import { tradeSideTone } from '../common/gradientBadgeTones'
import { useTradeStore, useUserStore } from '../../stores'
import type { OpenTradeRow } from '../../types/trade'
import { formatDateWithTime } from '../../util/time'

function SideBadge({ side }: { side: OpenTradeRow['option'] }) {
  return (
    <GradientBadge tone={tradeSideTone(side)} size="xs" uppercase>
      {side}
    </GradientBadge>
  )
}

export default function OpenTradesTable({ limit = 8 }: { limit?: number }) {
  const userId = useUserStore((s) => s.user?.user_id) ?? 'demo-user'
  const { trades, loading, loadTrades, closeTrade } = useTradeStore(
    useShallow((state) => ({
      trades: state.trades,
      loading: state.loading,
      loadTrades: state.loadTrades,
      closeTrade: state.closeTrade,
    }))
  )

  useEffect(() => {
    void loadTrades(userId)
  }, [loadTrades, userId])

  const rows = useMemo<OpenTradeRow[]>(
    () =>
      trades
        .filter((trade) => trade.status === 'open' || trade.status === 'pending')
        .slice(0, limit)
        .map((trade) => ({
          tradeId: trade.tradeId,
          pair: trade.pair,
          option: trade.option,
          entryPrice: String(trade.entryPrice),
          entryTime: trade.entryTime,
          invested: String(trade.invested),
          currency: trade.currency,
        })),
    [limit, trades]
  )

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
                    onClick={() => void closeTrade(info.tradeId)}
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
