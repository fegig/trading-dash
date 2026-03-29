import { Link } from "react-router"
import { useState } from "react"
import { MobileNavDrawer } from "./MobileNavDrawer"

function Header() {
  const [navOpen, setNavOpen] = useState(false)

  return (
    <header className="fixed top-0 left-0 right-0 z-50 h-14 flex items-center border-b border-neutral-800 bg-neutral-950/95 backdrop-blur-md px-4 md:px-6">
      <div className="max-w-[1920px] mx-auto w-full flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 min-w-0">
          <button
            type="button"
            className="lg:hidden flex items-center justify-center w-10 h-10 rounded-xl gradient-background text-neutral-300 hover:text-green-400 border border-neutral-800/80 shrink-0"
            onClick={() => setNavOpen(true)}
            aria-label="Open navigation menu"
            aria-expanded={navOpen}
          >
            <i className="fi fi-rr-menu-burger text-lg" />
          </button>

          <Link
            to="/dashboard"
            className="text-xl md:text-2xl font-bold text-green-400 shrink-0 tracking-tight hover:text-green-300 transition-colors"
          >
            BlockTrade
          </Link>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            className="gradient-background p-2! rounded-full! text-neutral-400 hover:text-green-400 transition-colors"
            aria-label="Account"
          >
            <i className="fi fi-rr-user" />
          </button>
        </div>
      </div>

      <MobileNavDrawer open={navOpen} onClose={() => setNavOpen(false)} />
    </header>
  )
}

export default Header
