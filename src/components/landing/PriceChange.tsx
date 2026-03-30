import { memo } from 'react'

type Props = { change: number | string | null | undefined }

export const PriceChange = memo(function PriceChange({ change }: Props) {
  if (change == null || change === '') return <span className="text-neutral-500">-</span>
  const num = Number(change)
  const cls =
    num < 0 ? 'text-red-400' : num > 0 ? 'text-green-400' : 'text-neutral-400'
  return (
    <span className={`text-sm font-medium tabular-nums ${cls}`}>
      {(num > 0 ? '+' : '') + num.toFixed(2)}%
    </span>
  )
})
