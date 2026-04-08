import { useState } from 'react'
import { formatCurrency, formatNumber } from '@/util/formatCurrency'
import DepthSelector from './DepthSelector'
import { MarketData } from './PairBanner'
import type { BookEntry } from '@/types/trading'

interface OrderBookProps {
  symbol: MarketData
  asks: BookEntry[]
  bids: BookEntry[]
  price?: number
  changePct24h?: number
}

function OrderBook({ symbol, asks, bids, price, changePct24h }: OrderBookProps) {
  const [depth, setDepth] = useState(10)

  const displayPrice = price ?? (asks[0] && bids[0] ? (asks[0].price + bids[0].price) / 2 : 0)
  const displayChange = changePct24h ?? 0

  const getOrders = (orders: BookEntry[], d: number) => orders.slice(0, d)

  const visibleBids = getOrders(bids, depth)
  const visibleAsks = getOrders(asks, depth)

  const bidDenom = Math.max(visibleBids.length - 1, 1)
  const askDenom = Math.max(visibleAsks.length - 1, 1)

  return (
    <div className="gradient-background w-full">
      <div className="flex justify-between items-center mb-2">
        <h3 className="text-lg font-bold">Order Book</h3>
        <div className="flex items-center space-x-4">
          <DepthSelector currentDepth={depth} onDepthChange={setDepth} />
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2 text-[10px] text-gray-400 mb-2">
        <div>Price ({symbol.QUOTE})</div>
        <div className="text-right">Size</div>
        <div className="text-right">Sum ({symbol.QUOTE})</div>
      </div>

      <div className="space-y-1">
        {visibleBids.length === 0 ? (
          <div className="text-[10px] text-neutral-600 py-2 text-center">Waiting for book data…</div>
        ) : (
          visibleBids.map((bid, i) => {
            const sum = bids.slice(0, i + 1).reduce((acc, curr) => acc + curr.price * curr.quantity, 0)
            const widthPercentage = 100 - (i / bidDenom) * 50
            return (
              <div key={`bid-${i}`} className="grid grid-cols-3 gap-4 text-[10px] relative">
                <div className="absolute inset-y-0 left-0 bg-green-400/10" style={{ width: `${widthPercentage}%` }} />
                <span className="text-green-400 relative">{formatNumber(bid.price, 2)}</span>
                <span className="text-gray-400 text-right relative">{formatNumber(bid.quantity, 4)}</span>
                <span className="text-gray-400 text-right relative">{formatNumber(sum, 2)}</span>
              </div>
            )
          })
        )}

        <div className="flex justify-between items-center py-1">
          <span className={`text-green-500 font-medium flex items-center space-x-1`}>
            <i className={`fi fi-rr-caret-${displayChange >= 0 ? 'up' : 'down'}`}></i>
            <span>{formatCurrency(displayPrice, 'USD')}</span>
          </span>
          <span className={`text-xs ${displayChange >= 0 ? 'text-green-400' : 'text-red-400'}`}>
            {displayChange >= 0 ? '+' : ''}{displayChange.toFixed(2)}%
          </span>
        </div>

        {visibleAsks.length === 0 ? (
          <div className="text-[10px] text-neutral-600 py-2 text-center">Waiting for book data…</div>
        ) : (
          visibleAsks.map((ask, i) => {
            const sum = asks.slice(i).reduce((acc, curr) => acc + curr.price * curr.quantity, 0)
            const widthPercentage = 50 + (i / askDenom) * 50
            return (
              <div key={`ask-${i}`} className="grid grid-cols-3 gap-4 text-[10px] relative">
                <div className="absolute inset-y-0 left-0 bg-red-400/10" style={{ width: `${widthPercentage}%` }} />
                <span className="text-red-400 relative">{formatNumber(ask.price, 2)}</span>
                <span className="text-gray-400 text-right relative">{formatNumber(ask.quantity, 4)}</span>
                <span className="text-gray-400 text-right relative">{formatNumber(sum, 2)}</span>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}

export default OrderBook
