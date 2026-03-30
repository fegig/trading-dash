import Modal from '../common/Modal'
import AssetAvatar from '../common/AssetAvatar'
import GradientBadge from '../common/GradientBadge'
import {
  keywordTone,
  tradeDirectionTone,
  tradeStatusTone,
} from '../common/gradientBadgeTones'
import type { TradePosition } from '../../types/trade'
import { formatCurrency, formatNumber } from '../../util/formatCurrency'
import { formatDateWithTime } from '../../util/time'

function clamp(value: number) {
  return Math.max(0, Math.min(100, value))
}

function markerPosition(value: number, min: number, max: number) {
  if (min === max) return 50
  return clamp(((value - min) / (max - min)) * 100)
}

function LabelValue({
  label,
  value,
  accent,
}: {
  label: string
  value: string
  accent?: string
}) {
  return (
    <div className="rounded-2xl border border-neutral-800 bg-neutral-950/60 px-4 py-3">
      <div className="text-[11px] uppercase tracking-[0.16em] text-neutral-500">{label}</div>
      <div className={`text-sm font-semibold mt-2 ${accent ?? 'text-neutral-100'}`}>{value}</div>
    </div>
  )
}

export function TradePreviewPanel({ trade }: { trade: TradePosition | null }) {
  if (!trade) {
    return (
      <div className="gradient-background rounded-2xl border border-neutral-800/80 p-6 text-center text-neutral-500">
        <i className="fi fi-rr-bullseye-pointer text-3xl mb-3 opacity-60" />
        <p className="text-sm">Select a trade to inspect its setup, execution, and risk profile.</p>
      </div>
    )
  }

  const pnlValue = trade.roi === 'pending' ? trade.pnl : Number(trade.roi)
  const pnlPositive = pnlValue >= 0
  const rangeMin = Math.min(trade.sl, trade.tp, trade.entryPrice, trade.marketPrice)
  const rangeMax = Math.max(trade.sl, trade.tp, trade.entryPrice, trade.marketPrice)
  const slPosition = markerPosition(trade.sl, rangeMin, rangeMax)
  const entryPosition = markerPosition(trade.entryPrice, rangeMin, rangeMax)
  const marketPosition = markerPosition(trade.marketPrice, rangeMin, rangeMax)
  const tpPosition = markerPosition(trade.tp, rangeMin, rangeMax)
  const fillLeft = Math.min(entryPosition, marketPosition)
  const fillWidth = Math.max(2, Math.abs(marketPosition - entryPosition))

  return (
    <div className="gradient-background rounded-2xl border border-neutral-800/80 p-5 space-y-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <div className="flex items-center -space-x-2">
              <AssetAvatar
                symbol={trade.base}
                name={trade.base}
                iconUrl={`https://assets.coincap.io/assets/icons/${trade.base.toLowerCase()}@2x.png`}
                sizeClassName="w-9 h-9"
              />
              <AssetAvatar
                symbol={trade.quote}
                name={trade.quote}
                iconUrl={`https://assets.coincap.io/assets/icons/${trade.quote.toLowerCase()}@2x.png`}
                sizeClassName="w-9 h-9"
              />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-neutral-100">{trade.pair}</h2>
              <p className="text-sm text-neutral-500 mt-1">{trade.strategy}</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2 mt-4">
            <GradientBadge tone={tradeStatusTone(trade.status)} size="xs">
              {trade.status}
            </GradientBadge>
            <GradientBadge tone={tradeDirectionTone(trade.direction)} size="xs">
              {trade.direction}
            </GradientBadge>
            <GradientBadge tone="neutral" size="xs">
              {trade.leverage}x leverage
            </GradientBadge>
            {trade.tags.slice(0, 3).map((tag) => (
              <GradientBadge key={tag} tone={keywordTone(tag)} size="xs">
                {tag}
              </GradientBadge>
            ))}
          </div>
        </div>

        <div className="text-right">
          <div className="text-[11px] uppercase tracking-[0.16em] text-neutral-500">PnL</div>
          <div className={`text-xl font-semibold mt-2 ${pnlPositive ? 'text-green-400' : 'text-rose-400'}`}>
            {pnlPositive ? '+' : ''}
            {formatCurrency(pnlValue, 'USD')}
          </div>
          <div className="text-xs text-neutral-500 mt-1">{trade.riskReward} setup</div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <LabelValue label="Entry" value={formatCurrency(trade.entryPrice, 'USD')} />
        <LabelValue
          label="Current"
          value={formatCurrency(trade.marketPrice, 'USD')}
          accent={trade.direction === 'long' ? 'text-green-300' : 'text-rose-300'}
        />
        <LabelValue label="Margin" value={formatCurrency(trade.margin, 'USD')} />
        <LabelValue label="Position Size" value={`${formatNumber(trade.size)} ${trade.base}`} />
        <LabelValue label="Funding Source" value={trade.fundedWith} />
        <LabelValue label="Execution Venue" value={trade.executionVenue} />
      </div>

      <div className="rounded-2xl border border-neutral-800 bg-neutral-950/60 p-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-neutral-200">Risk Map</h3>
            <p className="text-xs text-neutral-500 mt-1">Stop-loss to take-profit progress in live context.</p>
          </div>
          <div className="text-xs text-neutral-400">{trade.confidence}% confidence</div>
        </div>

        <div className="relative mt-7 h-12">
          <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-[2px] bg-neutral-800" />
          <div
            className={`absolute top-1/2 -translate-y-1/2 h-[2px] ${trade.direction === 'long' ? 'bg-green-500/70' : 'bg-rose-500/70'}`}
            style={{ left: `${fillLeft}%`, width: `${fillWidth}%` }}
          />

          {[
            { label: 'SL', value: trade.sl, position: slPosition, tone: 'text-rose-300', line: 'bg-rose-500' },
            { label: 'Entry', value: trade.entryPrice, position: entryPosition, tone: 'text-neutral-100', line: 'bg-white' },
            {
              label: 'Now',
              value: trade.marketPrice,
              position: marketPosition,
              tone: trade.direction === 'long' ? 'text-green-300' : 'text-rose-300',
              line: trade.direction === 'long' ? 'bg-green-500' : 'bg-rose-500',
            },
            { label: 'TP', value: trade.tp, position: tpPosition, tone: 'text-green-300', line: 'bg-green-500' },
          ].map((marker) => (
            <div key={marker.label} className="absolute top-1/2 -translate-y-1/2" style={{ left: `${marker.position}%` }}>
              <div className={`absolute -top-10 -translate-x-1/2 whitespace-nowrap text-[10px] ${marker.tone}`}>
                {marker.label}
                <div>{formatNumber(marker.value, marker.value > 1 ? 2 : 4)}</div>
              </div>
              <div className={`absolute -translate-x-1/2 h-4 w-[2px] ${marker.line}`} />
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-2xl border border-neutral-800 bg-neutral-950/60 p-4 space-y-3">
        <div>
          <h3 className="text-sm font-semibold text-neutral-200">Execution Notes</h3>
          <p className="text-sm text-neutral-400 mt-2">{trade.note}</p>
        </div>
        <div>
          <div className="text-[11px] uppercase tracking-[0.16em] text-neutral-500">Setup</div>
          <p className="text-sm text-neutral-400 mt-2">{trade.setup}</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <LabelValue label="Opened" value={formatDateWithTime(trade.entryTime)} />
        <LabelValue
          label="Closed"
          value={trade.closingTime === 'pending' ? 'Still running' : formatDateWithTime(trade.closingTime)}
        />
        <LabelValue label="Fees" value={formatCurrency(trade.fees, 'USD')} />
        <LabelValue label="Liquidation" value={formatCurrency(trade.liquidationPrice, 'USD')} />
      </div>
    </div>
  )
}

export default function TradePreviewDrawer({
  trade,
  open,
  onClose,
}: {
  trade: TradePosition | null
  open: boolean
  onClose: () => void
}) {
  return (
    <Modal
      isOpen={open}
      onClose={onClose}
      title={trade ? `${trade.pair} Preview` : 'Trade Preview'}
      variant="drawer"
    >
      <TradePreviewPanel trade={trade} />
    </Modal>
  )
}
