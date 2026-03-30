import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router'
import { useShallow } from 'zustand/react/shallow'
import PageHero from '../components/common/PageHero'
import TradeHistoryCard from '../components/trades/TradeHistoryCard'
import TradePreviewDrawer, { TradePreviewPanel } from '../components/trades/TradePreviewPanel'
import { useTradeStore, useUserStore } from '../stores'
import type { TradeStatus } from '../types/trade'
import { formatCurrency } from '../util/formatCurrency'

type HistoryType = Record<TradeStatus, boolean>

const defaultFilters: HistoryType = {
  open: true,
  pending: true,
  canceled: true,
  completed: true,
}

export default function AllTradesPage() {
  const userId = useUserStore((state) => state.user?.user_id) ?? 'demo-user'
  const { trades, loading, selectedTradeId, loadTrades, selectTrade } = useTradeStore(
    useShallow((state) => ({
      trades: state.trades,
      loading: state.loading,
      selectedTradeId: state.selectedTradeId,
      loadTrades: state.loadTrades,
      selectTrade: state.selectTrade,
    }))
  )

  const [filters, setFilters] = useState<HistoryType>(defaultFilters)
  const [previewOpen, setPreviewOpen] = useState(false)

  useEffect(() => {
    void loadTrades(userId)
  }, [loadTrades, userId])

  const filteredTrades = useMemo(
    () => trades.filter((trade) => filters[trade.status]),
    [filters, trades]
  )

  const selectedTrade =
    trades.find((trade) => trade.tradeId === selectedTradeId) ?? filteredTrades[0] ?? null

  const stats = useMemo(() => {
    const openCount = trades.filter((trade) => trade.status === 'open' || trade.status === 'pending').length
    const realized = trades
      .filter((trade) => trade.roi !== 'pending')
      .reduce((sum, trade) => sum + Number(trade.roi), 0)
    const completed = trades.filter((trade) => trade.status === 'completed')
    const wins = completed.filter((trade) => Number(trade.roi) > 0).length

    return [
      { label: 'Open Flow', value: `${openCount} active setups` },
      { label: 'Realized PnL', value: formatCurrency(realized, 'USD') },
      {
        label: 'Win Rate',
        value: completed.length ? `${Math.round((wins / completed.length) * 100)}%` : '0%',
      },
    ]
  }, [trades])

  const filterCounts = useMemo(
    () => ({
      open: trades.filter((trade) => trade.status === 'open').length,
      pending: trades.filter((trade) => trade.status === 'pending').length,
      completed: trades.filter((trade) => trade.status === 'completed').length,
      canceled: trades.filter((trade) => trade.status === 'canceled').length,
    }),
    [trades]
  )

  return (
    <div className="space-y-6">
      <PageHero
        backTo="/trade-center"
        backLabel="Back to Trade Center"
        eyebrow="Execution Archive"
        title="Trade history with setup context"
        description="Review every position with the same visual structure you use on the dashboard, then drill into full setup details, funding source, execution notes, and live risk mapping."
        iconClass="fi fi-rr-time-past"
        stats={stats}
        actions={
          <>
            <Link
              to="/live-trading"
              className="rounded-full border border-neutral-800 bg-neutral-950/70 px-4 py-2 text-sm text-neutral-300 hover:text-green-400 transition-colors"
            >
              Live trading desk
            </Link>
            <Link
              to="/wallet"
              className="rounded-full bg-green-500/15 px-4 py-2 text-sm text-green-300 hover:bg-green-500/25 transition-colors"
            >
              Review funding wallet
            </Link>
          </>
        }
      />

      <div className="gradient-background rounded-2xl border border-neutral-800/80 p-4">
        <div className="flex flex-wrap gap-3">
          {(Object.keys(filters) as TradeStatus[]).map((status) => (
            <button
              key={status}
              type="button"
              onClick={() => setFilters((prev) => ({ ...prev, [status]: !prev[status] }))}
              className={`rounded-full px-4 py-2 text-sm capitalize border transition-colors ${
                filters[status]
                  ? 'border-green-500/30 bg-green-500/10 text-green-300'
                  : 'border-neutral-800 bg-neutral-950/70 text-neutral-500'
              }`}
            >
              {status} ({filterCounts[status]})
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="gradient-background rounded-2xl min-h-[360px] animate-pulse" />
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_24rem] gap-6">
          <div className="space-y-4">
            {filteredTrades.length === 0 ? (
              <div className="gradient-background rounded-2xl p-8 text-center text-neutral-500">
                <i className="fi fi-rr-search-alt text-3xl mb-3 opacity-60" />
                <p className="text-sm">No trades match your current status filters.</p>
              </div>
            ) : (
              filteredTrades.map((trade) => (
                <TradeHistoryCard
                  key={trade.tradeId}
                  trade={trade}
                  active={selectedTrade?.tradeId === trade.tradeId}
                  onClick={() => {
                    selectTrade(trade.tradeId)
                    if (window.innerWidth < 1280) setPreviewOpen(true)
                  }}
                />
              ))
            )}
          </div>

          <div className="hidden xl:block">
            <div className="sticky top-6">
              <TradePreviewPanel trade={selectedTrade} />
            </div>
          </div>
        </div>
      )}

      <TradePreviewDrawer
        trade={selectedTrade}
        open={previewOpen && !!selectedTrade}
        onClose={() => setPreviewOpen(false)}
      />
    </div>
  )
}
