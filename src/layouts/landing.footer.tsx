import { Link } from 'react-router'

export default function LandingFooter() {
  return (
    <footer className="mt-auto border-t border-neutral-800 bg-neutral-950">
      <div className="mx-auto max-w-6xl px-4 py-10 md:px-6">
        <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
          <div>
            <h3 className="text-sm font-semibold text-neutral-200">BlockTrade</h3>
            <ul className="mt-3 space-y-2 text-sm text-neutral-500">
              <li>
                <Link to="/about" className="hover:text-green-400">
                  About
                </Link>
              </li>
              <li>
                <span className="text-neutral-600">How it works</span>
              </li>
            </ul>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-neutral-200">Help</h3>
            <ul className="mt-3 space-y-2 text-sm text-neutral-500">
              <li>
                <Link to="/help" className="hover:text-green-400">
                  Help center
                </Link>
              </li>
              <li>
                <span className="text-neutral-600">Privacy / policy</span>
              </li>
            </ul>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-neutral-200">Analytics</h3>
            <ul className="mt-3 space-y-2 text-sm text-neutral-500">
              <li>
                <Link to="/market" className="hover:text-green-400">
                  Markets
                </Link>
              </li>
              <li>
                <Link to="/insights" className="hover:text-green-400">
                  Insights
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-neutral-200">Community</h3>
            <div className="mt-3 flex gap-3 text-neutral-500">
              <a href="#" className="hover:text-green-400" aria-label="Twitter">
                <i className="fi fi-brands-twitter text-lg" />
              </a>
              <a href="#" className="hover:text-green-400" aria-label="Reddit">
                <i className="fi fi-brands-reddit text-lg" />
              </a>
              <a href="#" className="hover:text-green-400" aria-label="Instagram">
                <i className="fi fi-brands-instagram text-lg" />
              </a>
            </div>
          </div>
        </div>
        <p className="mt-10 text-center text-xs text-neutral-600">
          © {new Date().getFullYear()} BlockTrade. Crypto assets are volatile and not legal tender in all
          jurisdictions.
        </p>
      </div>
    </footer>
  )
}
