import { useMemo } from 'react'
import { Link } from 'react-router'
import { HIGHLIGHT_COINS, PREDEFINED_COINS } from '@/data/marketCoins'
import { paths } from '@/navigation/paths'
import { CurrencyCell } from './CurrencyCell'
import { PriceChange } from './PriceChange'
import { MarketingSurface } from './MarketingSurface'

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
    <MarketingSurface className="p-5 md:p-6">
      <div className="grid gap-3 md:grid-cols-3 xl:grid-cols-6">
        {highlights.map((row) => (
          <div
            key={row.symbol}
            className="rounded-2xl border border-neutral-800 bg-neutral-950/70 px-4 py-4"
          >
            <div className="flex items-center justify-between gap-3">
              <div>
                <div className="text-sm font-semibold text-neutral-100">{row.symbol}/USD</div>
                <div className="text-xs text-neutral-500">{row.name}</div>
              </div>
              <span className="rounded-full border border-neutral-800 bg-neutral-900/80 px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-neutral-400">
                Spread {row.spread.toFixed(2)}%
              </span>
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
        data-lenis-prevent
        className="mt-6 overflow-x-auto rounded-[24px] border border-neutral-800 bg-neutral-950/70"
      >
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead className="border-b border-neutral-800 bg-neutral-950/80">
            <tr className="text-[11px] uppercase tracking-[0.16em] text-neutral-500">
              <th className="px-4 py-3 font-semibold">Asset</th>
              <th className="px-4 py-3 font-semibold">Last Price</th>
              <th className="px-4 py-3 font-semibold">24h</th>
              <th className="px-4 py-3 font-semibold">24h Volume</th>
              <th className="px-4 py-3 font-semibold">Indicative Spread</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-800/80">
            {rows.map((row) => (
              <tr key={row.symbol} className="hover:bg-neutral-900/50">
                <td className="px-4 py-3">
                  <div className="font-medium text-neutral-100">{row.symbol}/USD</div>
                  <div className="text-xs text-neutral-500">{row.name}</div>
                </td>
                <td className="px-4 py-3">
                  <CurrencyCell value={row.price} symbol="$" />
                </td>
                <td className="px-4 py-3">
                  <PriceChange change={row.change} />
                </td>
                <td className="px-4 py-3 text-neutral-300">
                  <CurrencyCell value={row.volume} symbol="$" decimalScale={0} />
                </td>
                <td className="px-4 py-3 text-neutral-400">{row.spread.toFixed(2)}%</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-4 flex flex-col gap-3 border-t border-neutral-800/80 pt-4 text-sm text-neutral-500 md:flex-row md:items-center md:justify-between">
        <p>Illustrative market snapshot. Open a workspace to access your live trading desk and portfolio controls.</p>
        <Link to={paths.dashboardLiveTrading} className="font-medium text-green-300 transition hover:text-green-200">
          Open live desk
        </Link>
      </div>
    </MarketingSurface>
  )
}
