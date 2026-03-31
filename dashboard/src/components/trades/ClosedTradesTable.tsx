import { useEffect, useMemo } from 'react'
import { Link } from 'react-router'
import { useShallow } from 'zustand/react/shallow'
import GradientBadge from '../common/GradientBadge'
import { tradeSideTone, tradeStatusTone } from '../common/gradientBadgeTones'
import { useTradeStore, useUserStore } from '@/stores'
import type { ClosedTradeRow } from '@/types/trade'
import { formatDateWithTime } from '@/util/time'
import { paths } from '@/navigation/paths'

function SideBadge({ side }: { side: ClosedTradeRow['option'] }) {
  return (
    <GradientBadge tone={tradeSideTone(side)} size="xs" uppercase>
      {side}
    </GradientBadge>
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
  const { trades, loading, loadTrades } = useTradeStore(
    useShallow((state) => ({
      trades: state.trades,
      loading: state.loading,
      loadTrades: state.loadTrades,
    }))
  )

  useEffect(() => {
    void loadTrades(userId)
  }, [loadTrades, userId])

  const rows = useMemo<ClosedTradeRow[]>(
    () =>
      trades
        .filter((trade) => trade.status === 'completed' || trade.status === 'canceled')
        .slice(0, typeof limit === 'number' ? limit : trades.length)
        .map((trade) => ({
          tradeId: trade.tradeId,
          pair: trade.pair,
          option: trade.option,
          entryTime: trade.entryTime,
          entryPrice: String(trade.entryPrice),
          invested: String(trade.invested),
          currency: trade.currency,
          closingTime: trade.closingTime,
          closingPrice: trade.closingPrice === 'pending' ? 'Pending' : String(trade.closingPrice),
          status: trade.status,
          roi: trade.roi === 'pending' ? 'pending' : String(trade.roi),
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
        <p className="text-sm">No closed orders yet</p>
      </div>
    )
  }

  return (
    <div className="gradient-background p-0 rounded-xl overflow-hidden">
      {showViewAll && (
        <div className="flex justify-end px-4 pt-3">
          <Link
            to={paths.dashboardTrades}
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
                <td className="px-4 py-3">
                  <GradientBadge tone={tradeStatusTone(info.status)} size="xs">
                    {info.status}
                  </GradientBadge>
                </td>
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
