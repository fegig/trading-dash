import { Outlet } from 'react-router'
import LandingHeader from './landing.header'
import LandingFooter from './landing.footer'

export default function LandingLayout() {
  return (
    <div className="flex min-h-dvh flex-col bg-neutral-950 text-neutral-100">
      <LandingHeader />
      <div className="flex-1">
        <div className="mx-auto w-full max-w-6xl px-4 py-8 md:px-6 md:py-10">
          <Outlet />
        </div>
      </div>
      <LandingFooter />
    </div>
  )
}
