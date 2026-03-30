import { useMemo } from 'react'
import { HIGHLIGHT_COINS, PREDEFINED_COINS } from '@/data/marketCoins'
import { CurrencyCell } from './CurrencyCell'
import { PriceChange } from './PriceChange'

type MarketSnapshotRow = {
  symbol: string
  name: string
  price: number
  change: number
  volume: number
  spread: number
}

function buildMarketRow(symbol: string, name: string): MarketSnapshotRow {
  let seed = 0
  for (let index = 0; index < symbol.length; index += 1) seed += symbol.charCodeAt(index) * (index + 1)

  return {
    symbol,
    name,
    price: 25 + (seed % 60000) + (seed % 100) * 0.01,
    change: ((seed % 21) - 10) * 0.37,
    volume: 900000 + (seed % 7000000),
    spread: 0.1 + (seed % 30) / 100,
  }
}

export function LandingPairStrip() {
  const rows = useMemo(
    () =>
      PREDEFINED_COINS.slice(0, 8).map((coin) => buildMarketRow(coin.symbol, coin.name)),
    []
  )

  const highlights = rows.filter((row) =>
    HIGHLIGHT_COINS.some((highlight) => highlight === row.symbol)
  )

  return (
    <>
      <div className="grid gap-3 md:grid-cols-3 xl:grid-cols-6">
        {highlights.map((row) => (
          <div
            key={row.symbol}
            className=" gradient-background rounded-3xl! px-4 py-4"
          >
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
              
                <div>
                  <div className="text-sm font-semibold text-neutral-100">{row.symbol}/USD</div>
                  <div className="text-xs text-neutral-500">{row.name}</div>
                </div>
              </div>
              <div className="flex items-center -space-x-1">
                  <img src={`https://assets.coincap.io/assets/icons/${row.symbol.toLowerCase()}@2x.png`} alt={row.symbol} className="w-4 h-4 rounded-full" />
                  <img src={`https://assets.coincap.io/assets/icons/usdt@2x.png`} alt="USDT" className="w-4 h-4 rounded-full" />
                </div>
            </div>
            <div className="mt-4 text-xl font-semibold tracking-tight text-neutral-50">
              <CurrencyCell value={row.price} symbol="$" />
            </div>
            <div className="mt-3 flex items-center justify-between text-xs text-neutral-500">
              <PriceChange change={row.change} />
              <span>Vol ${Math.round(row.volume / 1000)}K</span>
            </div>
          </div>
        ))}
      </div>

      <div
        className="mt-6 overflow-x-auto relative"
      >
        <div className="absolute inset-0 bg-linear-to-t from-neutral-950/30 from-5% to-transparent to-100% "/>
        <div className='h-80 w-full'>
        <img src="/images/trading-dash.png" alt="Trading dashboard" className="w-full h-full object-cover" />

        </div>
    {/* image of the trading dasboard comes here */}
      </div>

 
    </>
  )
}
