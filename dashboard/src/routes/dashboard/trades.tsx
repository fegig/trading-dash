import { useEffect, useMemo, useState } from 'react'
import { useShallow } from 'zustand/react/shallow'
import Pagination from '@/components/common/Pagination'
import PageHero from '@/components/common/PageHero'
import TradeHistoryCard from '@/components/trades/TradeHistoryCard'
import TradePreviewDrawer, { TradePreviewPanel } from '@/components/trades/TradePreviewPanel'
import { useTradeStore, useUserStore } from '@/stores'
import type { TradeStatus } from '@/types/trade'
import { formatCurrency } from '@/util/formatCurrency'
import TradeHistoryFilter from '@/components/dashboard/TradeHistoryFilter'

type HistoryType = Record<TradeStatus, boolean>

const defaultFilters: HistoryType = {
  open: true,
  pending: true,
  canceled: true,
  completed: true,
  failed: true,
}

const TRADES_PAGE_SIZE = 10

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
  const [tradePage, setTradePage] = useState(1)
  const [previewOpen, setPreviewOpen] = useState(false)

  useEffect(() => {
    void loadTrades(userId)
  }, [loadTrades, userId])

  const filteredTrades = useMemo(
    () => trades.filter((trade) => filters[trade.status]),
    [filters, trades]
  )

  const paginatedTrades = useMemo(
    () =>
      filteredTrades.slice(
        (tradePage - 1) * TRADES_PAGE_SIZE,
        tradePage * TRADES_PAGE_SIZE
      ),
    [filteredTrades, tradePage]
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

  return (
    <div className="space-y-6">
      <PageHero
        backTo="/live-trading"
        backLabel="Back to Trading Desk"
        title="Trade history with setup context"
        description="Review every position with the same visual structure you use on the dashboard, then drill into full setup details, funding source, execution notes, and live risk mapping."
        stats={stats}

      />

      <TradeHistoryFilter historyType={filters} setHistoryType={setFilters} />

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
              <>
                {paginatedTrades.map((trade) => (
                  <TradeHistoryCard
                    key={trade.tradeId}
                    trade={trade}
                    active={selectedTrade?.tradeId === trade.tradeId}
                    onClick={() => {
                      selectTrade(trade.tradeId)
                      if (window.innerWidth < 1280) setPreviewOpen(true)
                    }}
                  />
                ))}
                <Pagination
                  page={tradePage}
                  pageSize={TRADES_PAGE_SIZE}
                  totalCount={filteredTrades.length}
                  onPageChange={setTradePage}
                />
              </>
            )}
          </div>

          <div className="hidden xl:block">
            <div className="sticky ">
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
