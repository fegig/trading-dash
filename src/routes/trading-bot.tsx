import { Link } from 'react-router'

export default function TradingBotPage() {
  return (
    <div className="p-6 max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-neutral-100">Trading bot</h1>
        <p className="text-sm text-neutral-500 mt-2">
          Automate strategies with guardrails — scheduling, paper mode, and exchange routing.
        </p>
      </div>
      <div className="gradient-background p-6 rounded-xl space-y-4">
        <h2 className="text-sm font-semibold text-neutral-300">Roadmap</h2>
        <p className="text-sm text-neutral-500">
          Bot builder, backtests, and deployment slots will appear here. Hook into the same
          services layer used by live trading.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {['Grid / DCA', 'Signal webhooks', 'Risk engine', 'Paper trading'].map((t) => (
            <div
              key={t}
              className="rounded-lg border border-neutral-800 bg-neutral-900/40 px-3 py-2 text-sm text-neutral-400"
            >
              {t}
            </div>
          ))}
        </div>
      </div>
      <Link to="/" className="text-sm text-green-400 hover:text-green-300 inline-flex items-center gap-1">
        <i className="fi fi-rr-angle-small-left" />
        Live trading
      </Link>
    </div>
  )
}
