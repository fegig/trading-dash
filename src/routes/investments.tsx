import { Link } from 'react-router'

export default function InvestmentsPage() {
  return (
    <div className="p-6 max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-neutral-100">Investments</h1>
        <p className="text-sm text-neutral-500 mt-2">
          Structured products, staking-style yields, and treasury allocations — unified with your
          wallet.
        </p>
      </div>
      <div className="gradient-background p-6 rounded-xl space-y-4">
        <p className="text-sm text-neutral-500">
          No products are linked yet. When your backend exposes offerings, list them here with APY,
          tenor, and subscription CTAs.
        </p>
        <div className="flex flex-wrap gap-2">
          <span className="text-xs px-2 py-1 rounded-full bg-neutral-800 text-neutral-400">
            Compliance review
          </span>
          <span className="text-xs px-2 py-1 rounded-full bg-neutral-800 text-neutral-400">
            Wallet integration
          </span>
        </div>
      </div>
      <Link to="/wallet" className="text-sm text-green-400 hover:text-green-300 inline-flex items-center gap-1">
        <i className="fi fi-rr-angle-small-left" />
        Wallet
      </Link>
    </div>
  )
}
