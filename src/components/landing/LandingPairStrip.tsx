import { useMemo } from 'react'
import { Link } from 'react-router'
import { HIGHLIGHT_COINS, PREDEFINED_COINS } from '@/data/marketCoins'
import { CurrencyCell } from './CurrencyCell'
import { PriceChange } from './PriceChange'
import { paths } from '@/navigation/paths'

/** Deterministic mock quote per symbol (no API dependency). */
function mockRow(symbol: string) {
  let h = 0
  for (let i = 0; i < symbol.length; i++) h += symbol.charCodeAt(i)
  const price = 50 + (h % 50000) + (h % 100) * 0.01
  const change = ((h % 17) - 8) * 0.35
  return { price, change }
}

export function LandingPairStrip() {
  const rows = useMemo(() => {
    return HIGHLIGHT_COINS.map((sym) => {
      const coin = PREDEFINED_COINS.find((c) => c.symbol === sym)
      const { price, change } = mockRow(sym)
      return { sym, name: coin?.name ?? sym, price, change }
    })
  }, [])

  return (
    <div className="overflow-x-auto rounded-xl border border-neutral-800 bg-neutral-900/40">
      <table className="w-full min-w-[520px] text-left text-sm">
        <thead>
          <tr className="border-b border-neutral-800 text-xs uppercase tracking-wide text-neutral-500">
            <th className="px-4 py-3">Pair</th>
            <th className="px-4 py-3">Price</th>
            <th className="px-4 py-3">24h</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.sym} className="border-b border-neutral-800/80 last:border-0">
              <td className="px-4 py-3">
                <span className="font-semibold text-neutral-100">{r.sym}</span>
                <span className="ml-2 text-neutral-500">{r.name}</span>
              </td>
              <td className="px-4 py-3">
                <CurrencyCell value={r.price} symbol="$" />
              </td>
              <td className="px-4 py-3">
                <PriceChange change={r.change} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="border-t border-neutral-800 px-4 py-2 text-center text-xs text-neutral-500">
        Illustrative data.{' '}
        <Link to={paths.dashboardLiveTrading} className="text-green-400 hover:text-green-300">
          Open live desk
        </Link>
      </p>
    </div>
  )
}
