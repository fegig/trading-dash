type Props = {
  goalPct: number
  label?: string
}

/** Simple progress ring — trading-dash styled */
export default function GoalProgressCard({ goalPct, label = 'Monthly goal' }: Props) {
  const pct = Math.min(100, Math.max(0, goalPct))
  return (
    <div className="gradient-background p-5 rounded-xl">
      <h3 className="text-sm font-semibold text-neutral-200 mb-4">{label}</h3>
      <div className="flex items-center gap-6">
        <div
          className="relative w-28 h-28 rounded-full grid place-items-center"
          style={{
            background: `conic-gradient(rgb(74 222 128) ${pct * 3.6}deg, rgb(38 38 38) 0deg)`,
          }}
        >
          <div className="absolute inset-2 rounded-full bg-neutral-950 grid place-items-center">
            <span className="text-lg font-bold text-green-400">{pct}%</span>
          </div>
        </div>
        <p className="text-sm text-neutral-500 flex-1">
          Track progress toward your trading target. Connect real data from your account to
          personalize this meter.
        </p>
      </div>
    </div>
  )
}
