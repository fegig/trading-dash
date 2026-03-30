import { Link, NavLink } from 'react-router'

export default function AuthHeader() {
  return (
    <header className="sticky top-0 z-50 border-b border-neutral-800/80 bg-neutral-950/90 backdrop-blur-md">
      <nav className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3.5 md:px-6">
        <Link
          to="/"
          className="text-lg font-bold tracking-tight text-green-400 transition-colors hover:text-green-300"
        >
          BlockTrade
        </Link>
        <div className="flex items-center gap-1 text-sm">
          <NavLink
            to="/login"
            className={({ isActive }) =>
              `rounded-lg px-3 py-2 font-medium transition-colors ${
                isActive ? 'bg-neutral-800 text-neutral-100' : 'text-neutral-400 hover:text-neutral-200'
              }`
            }
          >
            Sign in
          </NavLink>
          <NavLink
            to="/register"
            className={({ isActive }) =>
              `rounded-lg px-3 py-2 font-medium transition-colors ${
                isActive ? 'bg-neutral-800 text-neutral-100' : 'text-neutral-400 hover:text-neutral-200'
              }`
            }
          >
            Create account
          </NavLink>
        </div>
      </nav>
    </header>
  )
}
