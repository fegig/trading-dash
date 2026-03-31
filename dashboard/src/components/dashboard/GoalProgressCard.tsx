type Props = {
  goalPct: number
  label?: string
  description?: string
}

export default function GoalProgressCard({
  goalPct,
  label = 'Monthly goal',
  description = 'Track progress toward your trading target. Connect real data from your account to personalize this meter.',
}: Props) {
  const pct = Math.min(100, Math.max(0, goalPct))

  return (
    <div className="gradient-background p-5 rounded-xl">
      <h3 className="text-sm font-semibold text-neutral-200 mb-4">{label}</h3>
      <div className="flex items-center gap-6">
        <div
          className="relative grid h-28 w-28 place-items-center rounded-full"
          style={{
            background: `conic-gradient(rgb(74 222 128) ${pct * 3.6}deg, rgb(38 38 38) 0deg)`,
          }}
        >
          <div className="absolute inset-2 grid place-items-center rounded-full bg-neutral-950">
            <span className="text-lg font-bold text-green-400">{pct}%</span>
          </div>
        </div>
        <p className="flex-1 text-sm text-neutral-500">{description}</p>
      </div>
    </div>
  )
}
