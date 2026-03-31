import { useMemo } from 'react'
import GradientBadge from '@/components/common/GradientBadge'
import { CurrencyCell } from '@/components/landing/CurrencyCell'
import { PriceChange } from '@/components/landing/PriceChange'
import {
  MarketingButtonLink,
  MarketingEyebrow,
  MarketingSectionHeading,
  MarketingStatCard,
  MarketingSurface,
} from '@/components/landing/MarketingSurface'
import { PREDEFINED_COINS } from '@/data/marketCoins'
import { paths } from '@/navigation/paths'
import { useAuthStore, useCurrencyStore } from '@/stores'
import { formatLength } from '@/util/formatCurrency'

type MarketRow = {
  id: string
  symbol: string
  name: string
  price: number
  change: number
  volume: number
  marketCap: number
  high: number
  low: number
  spread: number
  spark: number[]
}

function buildMarketRow(id: string, symbol: string, name: string): MarketRow {
  let seed = 0
  const key = `${id}:${symbol}:${name}`

  for (let index = 0; index < key.length; index += 1) {
    seed += key.charCodeAt(index) * (index + 3)
  }

  const price = 12 + (seed % 62000) + (seed % 100) * 0.01
  const change = ((seed % 23) - 11) * 0.46
  const volume = 750000 + (seed % 9000000)
  const high = price * (1.01 + (seed % 5) / 100)
  const low = price * (0.98 - (seed % 3) / 200)
  const marketCap = volume * (8 + (seed % 7))
  const spread = 0.08 + (seed % 28) / 100
  const spark = Array.from({ length: 16 }, (_, index) => price * (1 + Math.sin(seed + index) * 0.018))

  return { id, symbol, name, price, change, volume, marketCap, high, low, spread, spark }
}

function MiniSparkline({ prices, positive }: { prices: number[]; positive: boolean }) {
  if (prices.length === 0) return <span className="text-neutral-600">-</span>

  const min = Math.min(...prices)
  const max = Math.max(...prices)
  const range = max - min || 1
  const width = 84
  const height = 28
  const step = width / Math.max(1, prices.length - 1)
  const points = prices
    .map((price, index) => `${index * step},${height - ((price - min) / range) * height}`)
    .join(' L ')

  return (
    <svg width={width} height={height} className={positive ? 'text-green-400' : 'text-rose-400'}>
      <path d={`M ${points}`} fill="none" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  )
}

export default function MarketPage() {
  const fiat = useCurrencyStore((state) => state.currency)
  const isLoggedIn = useAuthStore((state) => state.isLoggedIn)
  const symbol = fiat.symbol || '$'

  const rows = useMemo(
    () => PREDEFINED_COINS.map((coin) => buildMarketRow(coin.id, coin.symbol, coin.name)),
    []
  )

  const gainers = useMemo(
    () => [...rows].sort((left, right) => right.change - left.change).slice(0, 4),
    [rows]
  )
  const laggards = useMemo(
    () => [...rows].sort((left, right) => left.change - right.change).slice(0, 4),
    [rows]
  )
  const totalMarketCap = useMemo(
    () => rows.reduce((sum, row) => sum + row.marketCap, 0),
    [rows]
  )
  const totalVolume = useMemo(() => rows.reduce((sum, row) => sum + row.volume, 0), [rows])
  const advancers = useMemo(() => rows.filter((row) => row.change >= 0).length, [rows])
  const averageSpread = useMemo(
    () => rows.reduce((sum, row) => sum + row.spread, 0) / rows.length,
    [rows]
  )
  const primaryCta = isLoggedIn ? paths.dashboardLiveTrading : '/register'
  const secondaryCta = isLoggedIn ? paths.dashboard : '/login'

  return (
    <div className="space-y-14 md:space-y-18">
      <section className="grid gap-8 xl:grid-cols-[minmax(0,1fr)_30rem] xl:items-center">
        <div className="max-w-3xl">
          <MarketingEyebrow>Market overview</MarketingEyebrow>
          <h1 className="mt-5 text-4xl font-semibold leading-tight tracking-tight text-neutral-50 md:text-6xl">
            A market page that feels closer to the desk than to a brochure.
          </h1>
          <p className="mt-5 max-w-2xl text-base leading-8 text-neutral-400 md:text-lg">
            This overview keeps the tone restrained and operational: breadth, volume, momentum, and
            indicative pricing structure before the user moves into the live trading workspace.
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <MarketingButtonLink to={primaryCta}>
              {isLoggedIn ? 'Open live desk' : 'Open account'}
            </MarketingButtonLink>
            <MarketingButtonLink to={secondaryCta} variant="secondary">
              {isLoggedIn ? 'Open dashboard' : 'Sign in'}
            </MarketingButtonLink>
          </div>
        </div>

        <MarketingSurface className="p-5">
          <div className="flex items-center justify-between gap-3 border-b border-neutral-800 pb-4">
            <div>
              <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-neutral-500">
                Desk pulse
              </div>
              <div className="mt-1 text-lg font-semibold text-neutral-100">Top market leaders</div>
            </div>
            <GradientBadge tone="sky" size="xs">
              Fiat display {fiat.name}
            </GradientBadge>
          </div>

          <div className="mt-4 space-y-3">
            {rows.slice(0, 5).map((row) => (
              <div
                key={row.id}
                className="flex items-center justify-between gap-4 rounded-2xl border border-neutral-800 bg-neutral-950/70 px-4 py-3"
              >
                <div>
                  <div className="text-sm font-semibold text-neutral-100">{row.symbol}/USD</div>
                  <div className="text-xs text-neutral-500">{row.name}</div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-semibold text-neutral-100">
                    <CurrencyCell value={row.price} symbol={symbol} />
                  </div>
                  <div className="mt-1 text-xs">
                    <PriceChange change={row.change} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </MarketingSurface>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MarketingStatCard
          label="Tracked assets"
          value={`${rows.length} pairs`}
          description="A concise market board built from the same asset universe used in the product mock layer."
        />
        <MarketingStatCard
          label="Aggregate volume"
          value={`${symbol}${formatLength(totalVolume)}`}
          description="Illustrative activity across the assets surfaced on this public market board."
        />
        <MarketingStatCard
          label="Breadth"
          value={`${advancers}/${rows.length} green`}
          description="Quick directional read on how many tracked assets are advancing in the current snapshot."
        />
        <MarketingStatCard
          label="Avg. spread"
          value={`${averageSpread.toFixed(2)}%`}
          description="Indicative execution tightness so users understand the trading posture at a glance."
        />
      </section>

      <section className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_24rem]">
        <MarketingSurface className="p-5 md:p-6">
          <MarketingSectionHeading
            eyebrow="Market board"
            title="Illustrative pricing, breadth, and momentum"
            description="The public market page should already feel informed and organized, while still clearly signaling that the richer experience lives inside the authenticated trading desk."
          />

          <div
            data-lenis-prevent
            className="mt-6 overflow-x-auto rounded-[24px] border border-neutral-800 bg-neutral-950/75"
          >
            <table className="w-full min-w-[920px] text-left text-sm">
              <thead className="border-b border-neutral-800 bg-neutral-950/90">
                <tr className="text-[11px] uppercase tracking-[0.16em] text-neutral-500">
                  <th className="px-4 py-3 font-semibold">Asset</th>
                  <th className="px-4 py-3 font-semibold">Last</th>
                  <th className="px-4 py-3 font-semibold">24h</th>
                  <th className="px-4 py-3 font-semibold">Volume</th>
                  <th className="px-4 py-3 font-semibold">High</th>
                  <th className="px-4 py-3 font-semibold">Low</th>
                  <th className="px-4 py-3 font-semibold">Market cap</th>
                  <th className="px-4 py-3 font-semibold">7d</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-800/80">
                {rows.map((row) => (
                  <tr key={row.id} className="hover:bg-neutral-900/45">
                    <td className="px-4 py-3">
                      <div className="font-semibold text-neutral-100">{row.symbol}/USD</div>
                      <div className="text-xs text-neutral-500">{row.name}</div>
                    </td>
                    <td className="px-4 py-3 text-neutral-200">
                      <CurrencyCell value={row.price} symbol={symbol} />
                    </td>
                    <td className="px-4 py-3">
                      <PriceChange change={row.change} />
                    </td>
                    <td className="px-4 py-3 text-neutral-300">
                      <CurrencyCell value={row.volume} symbol={symbol} decimalScale={0} />
                    </td>
                    <td className="px-4 py-3 text-neutral-300">
                      <CurrencyCell value={row.high} symbol={symbol} />
                    </td>
                    <td className="px-4 py-3 text-neutral-300">
                      <CurrencyCell value={row.low} symbol={symbol} />
                    </td>
                    <td className="px-4 py-3 text-neutral-300">
                      {symbol}
                      {formatLength(row.marketCap)}
                    </td>
                    <td className="px-4 py-3">
                      <MiniSparkline prices={row.spark} positive={row.change >= 0} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </MarketingSurface>

        <div className="space-y-4">
          <MarketingSurface className="p-5">
            <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-neutral-500">
              Top gainers
            </div>
            <div className="mt-4 space-y-3">
              {gainers.map((row) => (
                <div
                  key={row.id}
                  className="rounded-2xl border border-neutral-800 bg-neutral-950/70 px-4 py-3"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <div className="text-sm font-semibold text-neutral-100">{row.symbol}/USD</div>
                      <div className="text-xs text-neutral-500">{row.name}</div>
                    </div>
                    <GradientBadge tone="green" size="xs">
                      +{row.change.toFixed(2)}%
                    </GradientBadge>
                  </div>
                </div>
              ))}
            </div>
          </MarketingSurface>

          <MarketingSurface className="p-5">
            <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-neutral-500">
              Laggards
            </div>
            <div className="mt-4 space-y-3">
              {laggards.map((row) => (
                <div
                  key={row.id}
                  className="rounded-2xl border border-neutral-800 bg-neutral-950/70 px-4 py-3"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <div className="text-sm font-semibold text-neutral-100">{row.symbol}/USD</div>
                      <div className="text-xs text-neutral-500">{row.name}</div>
                    </div>
                    <GradientBadge tone="red" size="xs">
                      {row.change.toFixed(2)}%
                    </GradientBadge>
                  </div>
                </div>
              ))}
            </div>
          </MarketingSurface>
        </div>
      </section>

      <section className="space-y-6">
        <MarketingSectionHeading
          eyebrow="Market structure"
          title="What this page is trying to communicate"
          description="A serious trading homepage should make the market layer readable before the user ever signs in: liquidity cues, breadth, leadership, and access to the live desk."
        />

        <div className="grid gap-4 md:grid-cols-3">
          <MarketingSurface className="p-5">
            <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-neutral-500">
              Large-cap focus
            </div>
            <div className="mt-3 text-xl font-semibold text-neutral-50">
              {symbol}
              {formatLength(totalMarketCap)}
            </div>
            <p className="mt-2 text-sm leading-6 text-neutral-500">
              High-level capitalization context for the tracked majors and liquid alt names.
            </p>
          </MarketingSurface>

          <MarketingSurface className="p-5">
            <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-neutral-500">
              Execution context
            </div>
            <div className="mt-3 text-xl font-semibold text-neutral-50">Indicative spread model</div>
            <p className="mt-2 text-sm leading-6 text-neutral-500">
              Public users should already understand that pricing quality and trading conditions matter.
            </p>
          </MarketingSurface>

          <MarketingSurface className="p-5">
            <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-neutral-500">
              Next step
            </div>
            <div className="mt-3 text-xl font-semibold text-neutral-50">Move into the desk</div>
            <p className="mt-2 text-sm leading-6 text-neutral-500">
              The authenticated workspace adds trade flow, portfolio state, and funding controls on top of this view.
            </p>
          </MarketingSurface>
        </div>
      </section>
    </div>
  )
}
