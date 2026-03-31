import { Outlet } from 'react-router'
import LandingHeader from './landing.header'
import LandingFooter from './landing.footer'

export default function LandingLayout() {
  return (
    <div className="relative flex min-h-dvh flex-col overflow-x-clip bg-neutral-950 text-neutral-100">
      <div
        className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_top_left,rgba(34,197,94,0.08),transparent_24%),radial-gradient(circle_at_bottom_right,rgba(255,255,255,0.03),transparent_26%)]"
        aria-hidden
      />
      <div
        className="pointer-events-none fixed inset-0 opacity-30 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-size-[32px_32px]"
        aria-hidden
      />

      <LandingHeader />
      <main className="relative flex-1 pt-22 md:pt-24">
        <div className="mx-auto w-full max-w-7xl px-4 py-10 md:px-6 md:py-14">
          <Outlet />
        </div>
      </main>
      <LandingFooter />
    </div>
  )
}
