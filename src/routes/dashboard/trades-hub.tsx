import { Link } from 'react-router'
import TraderSummaryPanel from '../../components/trades/TraderSummaryPanel'
import OpenTradesTable from '../../components/trades/OpenTradesTable'
import ClosedTradesTable from '../../components/trades/ClosedTradesTable'

/** Trades hub — summary, open orders, recent closed (not live chart) */
export default function TradesHubPage() {
  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-neutral-100 tracking-tight">Trade Center</h1>
          <p className="text-sm text-neutral-500 mt-1">
            Positions, performance, and recent history.
          </p>
        </div>
        <Link
          to="/trades"
          className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl gradient-background text-sm text-green-400 hover:text-green-300 border border-green-500/20"
        >
          <span>View all trades</span>
          <i className="fi fi-rr-angle-small-right" />
        </Link>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
        <div className="xl:col-span-4">
          <TraderSummaryPanel />
        </div>
        <div className="xl:col-span-8 space-y-8">
          <section>
            <h2 className="text-sm font-semibold text-neutral-300 mb-3 flex items-center gap-2">
              <i className="fi fi-rr-time-forward text-green-400" />
              Open orders
            </h2>
            <OpenTradesTable />
          </section>
          <section>
            <h2 className="text-sm font-semibold text-neutral-300 mb-3 flex items-center gap-2">
              <i className="fi fi-rr-check-circle text-green-400" />
              Recent closed
            </h2>
            <ClosedTradesTable limit={6} showViewAll />
          </section>
        </div>
      </div>
    </div>
  )
}
