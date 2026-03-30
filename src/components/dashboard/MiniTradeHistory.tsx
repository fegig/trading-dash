import { useEffect, useMemo, useState, type Dispatch, type SetStateAction } from 'react'
import { Link } from 'react-router'
import { useShallow } from 'zustand/react/shallow'
import Dropdown from '../common/Dropdown'
import Switch from '../common/SwitchOption'
import TradeHistoryCard from '../trades/TradeHistoryCard'
import TradePreviewDrawer from '../trades/TradePreviewPanel'
import { useTradeStore, useUserStore } from '../../stores'
import type { TradeStatus } from '../../types/trade'

type HistoryType = Record<TradeStatus, boolean>

type MiniTradeHistorySelectorProps = {
  historyType: HistoryType
  setHistoryType: Dispatch<SetStateAction<HistoryType>>
}

function MiniTradeHistorySelector({
  historyType,
  setHistoryType,
}: MiniTradeHistorySelectorProps) {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)

  const handleTypeToggle = (key: TradeStatus) => {
    setHistoryType((prev) => ({
      ...prev,
      [key]: !prev[key],
    }))
  }

  const getActiveTypesText = () => {
    const activeTypes = Object.entries(historyType)
      .filter(([, value]) => value)
      .map(([key]) => key)
      .join(', ')
    return activeTypes || 'Select Types'
  }

  return (
    <div className="flex justify-between items-center gap-3">
      <div className="gradient-background p-2 rounded-lg relative z-10">
        <Dropdown
          isOpen={isDropdownOpen}
          onClose={() => setIsDropdownOpen(false)}
          trigger={
            <button
              type="button"
              onClick={() => setIsDropdownOpen(true)}
              className="flex items-center justify-between hover:opacity-80 w-36"
            >
              <span className="text-xs font-medium capitalize truncate">{getActiveTypesText()}</span>
              <i
                className={`fi fi-rr-angle-down text-xs ${
                  isDropdownOpen ? 'rotate-180' : ''
                } transition-all duration-300 ml-2 shrink-0`}
              />
            </button>
          }
          items={[
            { key: 'open', label: 'Open' },
            { key: 'pending', label: 'Pending' },
            { key: 'canceled', label: 'Canceled' },
            { key: 'completed', label: 'Completed' },
          ]}
          renderItem={(item) => (
            <div className="flex items-center gap-2 px-4 py-2 hover:bg-neutral-800 rounded cursor-pointer">
              <Switch
                isOn={historyType[item.key as TradeStatus]}
                onToggle={() => handleTypeToggle(item.key as TradeStatus)}
              />
              <span className="capitalize text-xs">{item.label}</span>
            </div>
          )}
        />
      </div>

      <Link
        to="/trades"
        className="gradient-background rounded-lg px-3 py-2 text-xs text-neutral-400 hover:text-green-400 flex items-center gap-2 transition-colors"
      >
        <i className="fi fi-rr-exchange text-sm" />
        <span>All trades</span>
      </Link>
    </div>
  )
}

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
      <MiniTradeHistorySelector historyType={historyType} setHistoryType={setHistoryType} />

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
