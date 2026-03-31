import { useEffect, useState } from 'react'
import { useCurrencyStore, useUserStore } from '@/stores'
import * as userService from '@/services/userService'
import { formatNumber } from '@/util/formatCurrency'

type SummaryState = {
  fiat: number
  bonus: number
  totalTrades: number
  winPct: number
  lossPct: number
  pending: number
}

const defaultSummary: SummaryState = {
  fiat: 12480.5,
  bonus: 120,
  totalTrades: 48,
  winPct: 62.5,
  lossPct: 37.5,
  pending: 2,
}

function Row({
  icon,
  label,
  value,
}: {
  icon: string
  label: string
  value: React.ReactNode
}) {
  return (
    <div className="flex items-center justify-between gap-3 py-2 border-b border-neutral-800/60 last:border-0">
      <div className="flex items-center gap-2 text-sm text-neutral-400 min-w-0">
        <i className={`fi ${icon} text-green-400/90 shrink-0`} />
        <span className="truncate">{label}</span>
      </div>
      <div className="text-sm text-neutral-100 font-medium tabular-nums text-right">{value}</div>
    </div>
  )
}

export default function TraderSummaryPanel() {
  const userId = useUserStore((s) => s.user?.user_id) ?? 'demo-user'
  const currency = useCurrencyStore((s) => s.currency.symbol)
  const [s, setS] = useState<SummaryState>(defaultSummary)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      setLoading(true)
      const [bal, wl] = await Promise.all([
        userService.getOtherBalance(userId),
        userService.getWonLoss(userId),
      ])
      if (cancelled) return
      if (bal) {
        setS((prev) => ({
          ...prev,
          fiat: bal.fiat,
          bonus: bal.bonus,
        }))
      }
      if (wl) {
        const t = wl.won.length + wl.loss.length + wl.pending.length
        const winPct = t > 0 ? (wl.won.length / t) * 100 : 0
        const lossPct = t > 0 ? (wl.loss.length / t) * 100 : 0
        setS((prev) => ({
          ...prev,
          totalTrades: t,
          winPct: Number(winPct.toFixed(2)),
          lossPct: Number(lossPct.toFixed(2)),
          pending: wl.pending.length,
        }))
      }
      setLoading(false)
    })()
    return () => {
      cancelled = true
    }
  }, [userId])

  return (
    <div className="gradient-background p-4 rounded-xl">
      <h3 className="text-sm font-semibold text-neutral-200 mb-3 flex items-center gap-2">
        <i className="fi fi-rr-stats text-green-400" />
        Summary
      </h3>
      {loading ? (
        <div className="space-y-3 animate-pulse">
          <div className="h-4 bg-neutral-800 rounded w-3/4" />
          <div className="h-4 bg-neutral-800 rounded w-full" />
          <div className="h-4 bg-neutral-800 rounded w-5/6" />
        </div>
      ) : (
        <>
          <Row
            icon="fi-sr-money"
            label="Fiat balance"
            value={
              <>
                {currency}
                {formatNumber(s.fiat, 2)}
              </>
            }
          />
          <Row
            icon="fi-sr-gift"
            label="Bonus balance"
            value={
              <>
                {currency}
                {formatNumber(s.bonus, 2)}
              </>
            }
          />
          <Row icon="fi-sr-arrow-trend-up" label="Win rate" value={`${s.winPct}%`} />
          <Row icon="fi-sr-arrow-trend-down" label="Loss rate" value={`${s.lossPct}%`} />
          <Row icon="fi-sr-apps" label="Total orders" value={String(s.totalTrades)} />
          <Row icon="fi-sr-hourglass-end" label="Open orders" value={String(s.pending)} />
          <Row icon="fi-sr-bolt" label="Leverage" value="1:500" />
        </>
      )}
    </div>
  )
}
