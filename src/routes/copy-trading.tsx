import { Link } from 'react-router'

export default function CopyTradingPage() {
  return (
    <div className="p-6 max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-neutral-100">Copy trading</h1>
        <p className="text-sm text-neutral-500 mt-2">
          Follow verified lead traders, mirror allocations, and set your own risk caps.
        </p>
      </div>
      <div className="gradient-background p-6 rounded-xl space-y-4">
        <h2 className="text-sm font-semibold text-neutral-300">Coming soon</h2>
        <p className="text-sm text-neutral-500">
          We are finishing allocation controls, drawdown limits, and trader leaderboards. Connect
          your API keys when this module launches.
        </p>
        <ul className="text-sm text-neutral-400 space-y-2 list-disc list-inside">
          <li>Pick traders by style, win rate, and max drawdown</li>
          <li>Per-trade and daily stop-loss</li>
          <li>Pause or scale exposure in one click</li>
        </ul>
      </div>
      <Link to="/trade-center" className="text-sm text-green-400 hover:text-green-300 inline-flex items-center gap-1">
        <i className="fi fi-rr-angle-small-left" />
        Trade Center
      </Link>
    </div>
  )
}
