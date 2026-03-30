import { Link } from 'react-router'

export default function NotFoundPage() {
  return (
    <div className="min-h-dvh flex flex-col items-center justify-center bg-neutral-950 px-4 text-center">
      <div className="gradient-background max-w-md border border-neutral-800/80 p-8">
        <p className="text-sm font-medium uppercase tracking-wider text-neutral-500">Error 404</p>
        <h1 className="mt-2 text-2xl font-bold text-neutral-100">Page not found</h1>
        <p className="mt-3 text-sm text-neutral-400">
          Check the URL or return to the home page or your dashboard.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <Link
            to="/"
            className="rounded-xl border border-neutral-700 px-4 py-2 text-sm text-neutral-200 hover:border-green-500/50 hover:text-green-400"
          >
            Home
          </Link>
          <Link
            to="/dashboard"
            className="rounded-xl bg-green-500/90 px-4 py-2 text-sm font-semibold text-neutral-950 hover:bg-green-400"
          >
            Dashboard
          </Link>
        </div>
      </div>
    </div>
  )
}
