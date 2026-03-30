import { useEffect, useMemo, useState } from 'react'
import { useShallow } from 'zustand/react/shallow'
import TradeHistoryCard from '../trades/TradeHistoryCard'
import TradePreviewDrawer from '../trades/TradePreviewPanel'
import { useTradeStore, useUserStore } from '@/stores'
import type { HistoryType } from './TradeHistoryFilter'
import TradeHistoryFilter from './TradeHistoryFilter'


export default function MiniTradeHistory() {
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

  const [historyType, setHistoryType] = useState<HistoryType>({
    open: true,
    pending: true,
    canceled: true,
    completed: true,
    failed: true,
  })
  const [previewOpen, setPreviewOpen] = useState(false)

  useEffect(() => {
    void loadTrades(userId)
  }, [loadTrades, userId])

  const filteredHistory = useMemo(
    () => trades.filter((trade) => historyType[trade.status]),
    [historyType, trades]
  )

  const selectedTrade =
    trades.find((trade) => trade.tradeId === selectedTradeId) ?? filteredHistory[0] ?? null

  if (loading) {
    return <div className="gradient-background rounded-2xl min-h-[240px] animate-pulse" />
  }

  return (
    <>
      <TradeHistoryFilter historyType={historyType} setHistoryType={setHistoryType} showAllTrades={true} />

      <div className="max-h-[310px] overflow-y-auto scrollbar-none mt-4">
        <div className="flex flex-col space-y-4 pb-4">
          {filteredHistory.length === 0 ? (
            <div className="gradient-background rounded-2xl p-6 text-center text-neutral-500">
              <i className="fi fi-rr-search-alt text-2xl mb-3 opacity-60" />
              <p className="text-sm">No trades match the selected filters.</p>
            </div>
          ) : (
            filteredHistory.map((trade) => (
              <TradeHistoryCard
                key={trade.tradeId}
                trade={trade}
                compact
                active={selectedTrade?.tradeId === trade.tradeId}
                onClick={() => {
                  selectTrade(trade.tradeId)
                  setPreviewOpen(true)
                }}
              />
            ))
          )}
        </div>
      </div>

      <TradePreviewDrawer
        trade={selectedTrade}
        open={previewOpen && !!selectedTrade}
        onClose={() => setPreviewOpen(false)}
      />
    </>
  )
}
