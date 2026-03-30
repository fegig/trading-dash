import { Outlet } from 'react-router'
import AuthHeader from './auth.header'

export default function AuthLayout() {
  return (
    <div className="relative flex min-h-dvh flex-col bg-neutral-950 text-neutral-100">
      <div
        className="pointer-events-none fixed inset-0 bg-[radial-gradient(ellipse_85%_55%_at_50%_-18%,rgba(34,197,94,0.11),transparent)]"
        aria-hidden
      />
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_100%_100%,rgba(23,23,23,0.9),transparent_45%)]" aria-hidden />
      <AuthHeader />
      <div className="relative flex flex-1 flex-col items-center px-4 py-10 md:py-14">
        <div className="w-full max-w-[440px]">
          <Outlet />
        </div>
        <p className="relative mt-12 text-center text-xs text-neutral-600">
          © {new Date().getFullYear()} BlockTrade. All rights reserved.
        </p>
      </div>
    </div>
  )
}
