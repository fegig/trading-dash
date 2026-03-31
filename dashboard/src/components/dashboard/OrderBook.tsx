import { useEffect, useState } from 'react'
import { formatCurrency, formatNumber } from '@/util/formatCurrency'
import DepthSelector from './DepthSelector'
import { MarketData } from './PairBanner'
import { liveOrderBookWsUrl } from '@/util/liveWs'

interface OrderBookEntry {
  price: number
  quantity: number
}

const defaultAsks: OrderBookEntry[] = [
  { price: 43300.75, quantity: 0.315 },
  { price: 43275.5, quantity: 1.12 },
  { price: 43250.25, quantity: 0.4235 },
  { price: 43225.5, quantity: 1.21 },
  { price: 43200.75, quantity: 0.875 },
  { price: 43175.0, quantity: 2.1 },
  { price: 43150.25, quantity: 1.55 },
  { price: 43125.75, quantity: 0.93 },
  { price: 43100.5, quantity: 1.64 },
  { price: 43075.25, quantity: 0.78 },
]

const defaultBids: OrderBookEntry[] = [
  { price: 43050.0, quantity: 1.89 },
  { price: 43025.75, quantity: 0.925 },
  { price: 43000.5, quantity: 1.34 },
  { price: 42975.25, quantity: 2.45 },
  { price: 42950.0, quantity: 0.68 },
  { price: 42925.75, quantity: 1.23 },
  { price: 42900.5, quantity: 0.89 },
  { price: 42875.25, quantity: 1.76 },
  { price: 42850.0, quantity: 0.54 },
  { price: 42825.75, quantity: 1.42 },
]

function OrderBook({ symbol }: { symbol: MarketData }) {
  const [asks, setAsks] = useState<OrderBookEntry[]>(defaultAsks)
  const [bids, setBids] = useState<OrderBookEntry[]>(defaultBids)
  const [marketData, setMarketData] = useState<MarketData>({
    PRICE: 43150.75,
    CHANGEPCT24HOUR: 2.45,
  })
  const [depth, setDepth] = useState(10)

  useEffect(() => {
    if (!symbol.BASE || !symbol.QUOTE) return
    const pair = `${symbol.BASE}-${symbol.QUOTE}`.toUpperCase()
    const url = liveOrderBookWsUrl(pair)
    let ws: WebSocket | null = null
    try {
      ws = new WebSocket(url)
    } catch {
      return
    }

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data as string) as {
          type?: string
          asks?: OrderBookEntry[]
          bids?: OrderBookEntry[]
          price?: number
        }
        if (data.type === 'snapshot' || data.type === 'order_filled' || data.type === 'book_update') {
          if (Array.isArray(data.asks) && data.asks.length > 0) setAsks(data.asks)
          if (Array.isArray(data.bids) && data.bids.length > 0) setBids(data.bids)
          if (typeof data.price === 'number' && Number.isFinite(data.price)) {
            setMarketData((prev) => ({
              ...prev,
              PRICE: data.price as number,
            }))
          }
        }
      } catch {
        /* ignore malformed */
      }
    }

    return () => {
      ws?.close()
    }
  }, [symbol.BASE, symbol.QUOTE])

  const getOrders = (orders: OrderBookEntry[], d: number) => orders.slice(0, d)

  const bidDenom = Math.max(bids.length - 1, 1)
  const askDenom = Math.max(asks.length - 1, 1)

  return (
    <div className="gradient-background  w-full">
      <div className="flex justify-between items-center mb-2">
        <h3 className="text-lg font-bold">Order Book</h3>
        <div className="flex items-center space-x-4">
          <DepthSelector currentDepth={depth} onDepthChange={setDepth} />
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2 text-[10px] text-gray-400 mb-2">
        <div>Price ({symbol.QUOTE})</div>
        <div className="text-right">Size ({symbol.QUOTE})</div>
        <div className="text-right">Sum ({symbol.QUOTE})</div>
      </div>

      <div className="space-y-1">
        {getOrders(bids, depth).map((bid, i) => {
          const sum = bids.slice(0, i + 1).reduce((acc, curr) => acc + curr.price * curr.quantity, 0)
          const widthPercentage = 100 - (i / bidDenom) * 50

          return (
            <div key={`bid-${i}`} className="grid grid-cols-3 gap-4 text-[10px] relative">
              <div
                className="absolute inset-y-0 left-0 bg-green-400/10"
                style={{ width: `${widthPercentage}%` }}
              />
              <span className="text-green-400 relative">{formatNumber(bid.price, 2)}</span>
              <span className="text-gray-400 text-right relative">{formatNumber(bid.quantity, 4)}</span>
              <span className="text-gray-400 text-right relative">{formatNumber(sum, 2)}</span>
            </div>
          )
        })}

        <div className="flex justify-between items-center">
          <span className="text-green-500 font-medium flex items-center space-x-1">
            <i className="fi fi-rr-caret-up"></i>
            {formatCurrency(marketData.PRICE || 0, 'USD')}
          </span>

          <span
            className={`text-xs ${marketData.CHANGEPCT24HOUR && marketData.CHANGEPCT24HOUR >= 0 ? 'text-green-400' : 'text-red-400'}`}
          >
            {marketData.CHANGEPCT24HOUR && marketData.CHANGEPCT24HOUR >= 0 ? '+' : ''}
            {marketData.CHANGEPCT24HOUR?.toFixed(2)}%
          </span>
        </div>

        {getOrders(asks, depth).map((ask, i) => {
          const sum = asks.slice(i).reduce((acc, curr) => acc + curr.price * curr.quantity, 0)
          const widthPercentage = 50 + (i / askDenom) * 50

          return (
            <div key={`ask-${i}`} className="grid grid-cols-3 gap-4 text-[10px] relative">
              <div
                className="absolute inset-y-0 left-0 bg-red-400/10"
                style={{ width: `${widthPercentage}%` }}
              />
              <span className="text-red-400 relative">{formatNumber(ask.price, 2)}</span>
              <span className="text-gray-400 text-right relative">{formatNumber(ask.quantity, 4)}</span>
              <span className="text-gray-400 text-right relative">{formatNumber(sum, 2)}</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default OrderBook
