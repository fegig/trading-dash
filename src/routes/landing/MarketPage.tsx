import { useMemo } from 'react'
import { PREDEFINED_COINS } from '@/data/marketCoins'
import { CurrencyCell } from '@/components/landing/CurrencyCell'
import { PriceChange } from '@/components/landing/PriceChange'
import { useCurrencyStore } from '@/stores'

function mockMarket(symbol: string) {
  let h = 0
  for (let i = 0; i < symbol.length; i++) h += symbol.charCodeAt(i)
  const price = 0.01 + (h % 99999) * (h % 7) * 0.01
  const change = ((h % 19) - 9) * 0.42
  const vol = (h % 1000000) * 1000
  const high = price * 1.02
  const low = price * 0.98
  const mcap = vol * 12
  const spark = Array.from({ length: 12 }, (_, i) => price * (1 + Math.sin(i + h) * 0.02))
  return { price, change, vol, high, low, mcap, spark }
}

function MiniSparkline({ prices, positive }: { prices: number[]; positive: boolean }) {
  if (!prices.length) return <span className="text-neutral-600">-</span>
  const min = Math.min(...prices)
  const max = Math.max(...prices)
  const range = max - min || 1
  const w = 72
  const h = 24
  const step = w / (prices.length - 1)
  const pts = prices.map((p, i) => `${i * step},${h - ((p - min) / range) * h}`).join(' L ')
  return (
    <svg width={w} height={h} className={positive ? 'text-green-400' : 'text-red-400'}>
      <path d={`M ${pts}`} fill="none" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  )
}

export default function MarketPage() {
  const fiat = useCurrencyStore((s) => s.currency)
  const sym = fiat.symbol || '$'

  const rows = useMemo(
    () =>
      PREDEFINED_COINS.map((c) => ({
        coin: c,
        ...mockMarket(c.symbol),
      })),
    []
  )

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-neutral-50">Markets</h1>
        <p className="mt-2 text-sm text-neutral-500">
          Overview of major assets (illustrative snapshot). Fiat display: {fiat.name}.
        </p>
      </div>

      <div className="overflow-x-auto rounded-xl border border-neutral-800 bg-neutral-900/40">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead>
            <tr className="border-b border-neutral-800 text-xs uppercase tracking-wide text-neutral-500">
              <th className="px-3 py-3">Asset</th>
              <th className="px-3 py-3">Price</th>
              <th className="px-3 py-3">24h</th>
              <th className="px-3 py-3">Volume</th>
              <th className="px-3 py-3">High</th>
              <th className="px-3 py-3">Low</th>
              <th className="px-3 py-3">Mcap</th>
              <th className="px-3 py-3">7d</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(({ coin, price, change, vol, high, low, mcap, spark }) => (
              <tr key={coin.id} className="border-b border-neutral-800/80 last:border-0">
                <td className="px-3 py-2">
                  <span className="font-semibold text-neutral-100">{coin.symbol}</span>
                  <span className="ml-2 text-neutral-500">{coin.name}</span>
                </td>
                <td className="px-3 py-2">
                  <CurrencyCell value={price} symbol={sym} />
                </td>
                <td className="px-3 py-2">
                  <PriceChange change={change} />
                </td>
                <td className="px-3 py-2">
                  <CurrencyCell value={vol} symbol={sym} decimalScale={0} />
                </td>
                <td className="px-3 py-2">
                  <CurrencyCell value={high} symbol={sym} />
                </td>
                <td className="px-3 py-2">
                  <CurrencyCell value={low} symbol={sym} />
                </td>
                <td className="px-3 py-2">
                  <CurrencyCell value={mcap} symbol={sym} decimalScale={0} />
                </td>
                <td className="px-3 py-2">
                  <MiniSparkline prices={spark} positive={change >= 0} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
