import AssetAvatar from '../common/AssetAvatar'
import GradientBadge from '../common/GradientBadge'
import {
  keywordTone,
  tradeDirectionTone,
  tradeStatusTone,
} from '../common/gradientBadgeTones'
import type { TradePosition } from '@/types/trade'
import { formatCurrency, formatNumber } from '@/util/formatCurrency'
import { formatDateWithTime } from '@/util/time'

function clamp(value: number) {
  return Math.max(0, Math.min(100, value))
}

function metricValue(trade: TradePosition) {
  const pnlValue = trade.roi === 'pending' ? trade.pnl : Number(trade.roi)
  const positive = pnlValue >= 0
  return {
    value: `${positive ? '+' : ''}${formatCurrency(pnlValue, 'USD')}`,
    className: positive ? 'text-green-300' : 'text-rose-300',
  }
}

function markerPosition(value: number, min: number, max: number) {
  if (min === max) return 50
  return clamp(((value - min) / (max - min)) * 100)
}

export default function TradeHistoryCard({
  trade,
  compact = false,
  active = false,
  onClick,
}: {
  trade: TradePosition
  compact?: boolean
  active?: boolean
  onClick?: () => void
}) {
  const pnl = metricValue(trade)
  const rangeMin = Math.min(trade.sl, trade.tp, trade.entryPrice, trade.marketPrice)
  const rangeMax = Math.max(trade.sl, trade.tp, trade.entryPrice, trade.marketPrice)
  const entryPosition = markerPosition(trade.entryPrice, rangeMin, rangeMax)
  const marketPosition = markerPosition(trade.marketPrice, rangeMin, rangeMax)
  const fillLeft = Math.min(entryPosition, marketPosition)
  const fillWidth = Math.max(2, Math.abs(marketPosition - entryPosition))
  const markerTone = trade.direction === 'long' ? 'bg-green-500' : 'bg-rose-500'

  const metrics = compact
    ? [
        { label: 'Type', value: trade.direction, className: trade.direction === 'long' ? 'text-green-300' : 'text-rose-300' },
        { label: 'Margin', value: formatCurrency(trade.margin, 'USD') },
        { label: 'Entry', value: formatCurrency(trade.entryPrice, 'USD') },
        { label: 'PnL', value: pnl.value, className: pnl.className },
      ]
    : [
        { label: 'Type', value: trade.direction, className: trade.direction === 'long' ? 'text-green-300' : 'text-rose-300' },
        { label: 'Leverage', value: `${trade.leverage}x` },
        { label: 'Margin', value: formatCurrency(trade.margin, 'USD') },
        { label: 'Entry', value: formatCurrency(trade.entryPrice, 'USD') },
        { label: 'Position', value: `${formatNumber(trade.size)} ${trade.base}` },
        { label: 'PnL', value: pnl.value, className: pnl.className },
      ]

  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full text-left gradient-background rounded-2xl border transition-all ${
        active ? 'border-green-500/30 shadow-green-500/10' : 'border-neutral-800/80 hover:border-neutral-700'
      } ${compact ? 'p-4' : 'p-5'}`}
    >
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0">
            <div className="flex items-center gap-3">
              <div className="flex items-center -space-x-2">
                <AssetAvatar
                  symbol={trade.base}
                  name={trade.base}
                  iconUrl={`https://assets.coincap.io/assets/icons/${trade.base.toLowerCase()}@2x.png`}
                  sizeClassName={compact ? 'w-6 h-6' : 'w-7 h-7'}
                />
                <AssetAvatar
                  symbol={trade.quote}
                  name={trade.quote}
                  iconUrl={`https://assets.coincap.io/assets/icons/${trade.quote.toLowerCase()}@2x.png`}
                  sizeClassName={compact ? 'w-6 h-6' : 'w-7 h-7'}
                />
              </div>

              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-sm font-semibold text-neutral-100">{trade.pair}</span>
                  <GradientBadge tone={tradeStatusTone(trade.status)} size="xs">
                    {trade.status}
                  </GradientBadge>
                  <GradientBadge tone={tradeDirectionTone(trade.direction)} size="xs">
                    {trade.direction}
                  </GradientBadge>
                </div>
                <p className="text-xs text-neutral-500 mt-2">{trade.strategy}</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {trade.tags.slice(0, compact ? 2 : 3).map((tag) => (
                    <GradientBadge key={tag} tone={keywordTone(tag)} size="xs">
                      {tag}
                    </GradientBadge>
                  ))}
                </div>
              </div>
            </div>

            <div className={`grid gap-3 mt-4 ${compact ? 'grid-cols-2 sm:grid-cols-4' : 'grid-cols-2 md:grid-cols-3 xl:grid-cols-6'}`}>
              {metrics.map((metric) => (
                <div key={metric.label}>
                  <div className="text-[8px]  tracking-[0.16em] text-neutral-500">{metric.label}</div>
                  <div className={`text-xs font-medium mt-2 capitalize ${metric.className ?? 'text-neutral-200'}`}>
                    {metric.value}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="lg:text-right">
            <div className="text-[8px]  tracking-[0.16em] text-neutral-500">Opened</div>
            <div className="text-xs text-neutral-200 mt-2">{formatDateWithTime(trade.entryTime)}</div>
            <div className="text-[8px] text-neutral-500 mt-2">{trade.fundedWith}</div>
          </div>
        </div>

        <div className="">
          <div className="flex items-center justify-between text-[8px]  tracking-[0.16em] text-neutral-500">
            <span>SL</span>
            <span>Trade Progress</span>
            <span>TP</span>
          </div>

          <div className="relative mt-4 h-8">
            <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-[2px] bg-neutral-800" />
            <div
              className={`absolute top-1/2 -translate-y-1/2 h-[2px] ${trade.direction === 'long' ? 'bg-green-500/70' : 'bg-rose-500/70'}`}
              style={{ left: `${fillLeft}%`, width: `${fillWidth}%` }}
            />

            <div className="absolute top-1/2 -translate-y-1/2" style={{ left: `${entryPosition}%` }}>
            <div className="absolute flex flex-col items-center">
              <div className="absolute top-2 whitespace-nowrap text-center">
                <span className="block text-[8px] text-neutral-400">Entry</span>
                <span className="block text-[8px]">{formatCurrency(trade.entryPrice, 'USD')}</span>
                </div>
                <div className="absolute h-4 w-[2px] bg-white top-1/2 -translate-y-1/2" />
              </div>
            </div>

            <div className="absolute top-1/2 -translate-y-1/2" style={{ left: `${marketPosition}%` }}>
            
              <div className={`absolute -top-8 -translate-x-1/2 `}>
               <span className="block text-[8px] text-neutral-400">Now</span>
              <span className={`block text-[8px] ${trade.direction === 'long' ? 'text-green-300' : 'text-rose-300'} `}>{formatCurrency(trade.marketPrice, 'USD')}</span>
         
              </div>
              
              <div className={`absolute h-4 w-[2px]  top-1/2 -translate-y-1/2 ${markerTone}`} />
            </div>
          </div>

          <div className="flex items-center justify-between text-xs text-neutral-400">
            <span>{formatNumber(trade.sl, trade.sl > 1 ? 2 : 4)}</span>
            <span>{formatNumber(trade.tp, trade.tp > 1 ? 2 : 4)}</span>
          </div>
        </div>
      </div>
    </button>
  )
}
