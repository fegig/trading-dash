import { memo } from 'react'

type Props = {
  value: number | string | null | undefined
  symbol?: string
  decimalScale?: number
}

export const CurrencyCell = memo(function CurrencyCell({
  value,
  symbol = '',
  decimalScale = 2,
}: Props) {
  if (value == null) return <span className="text-neutral-500">-</span>
  const n = typeof value === 'string' ? parseFloat(value) : value
  if (Number.isNaN(n)) return <span className="text-neutral-500">-</span>
  const formatted = n.toLocaleString(undefined, {
    minimumFractionDigits: decimalScale,
    maximumFractionDigits: decimalScale,
  })
  return (
    <span className="tabular-nums text-neutral-200">
      {symbol}
      {formatted}
    </span>
  )
})
