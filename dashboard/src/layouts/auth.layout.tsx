import { Outlet } from 'react-router'
import AuthHeader from './auth.header'
import { useSiteConfigStore, SITE_NAME_FALLBACK } from '@/stores'

function AuthFooterNote() {
  const siteName = useSiteConfigStore((s) => s.siteName)
  const displayName = siteName?.trim() || SITE_NAME_FALLBACK
  return (
    <>
      (c) {new Date().getFullYear()} {displayName}. Secure access does not eliminate market risk.
    </>
  )
}

export default function AuthLayout() {
  return (
    <div className="relative flex min-h-dvh flex-col overflow-x-clip bg-neutral-950 text-neutral-100">
      <div
        className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_top_left,rgba(34,197,94,0.09),transparent_26%),radial-gradient(circle_at_bottom_right,rgba(255,255,255,0.03),transparent_24%)]"
        aria-hidden
      />
      <div
        className="pointer-events-none fixed inset-0 opacity-30 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-size-[30px_30px]"
        aria-hidden
      />

      <AuthHeader />
      <main className="relative flex flex-1 items-start px-4 py-8 pt-26 md:px-6 md:py-12 md:pt-28 lg:items-center">
        <div className="mx-auto w-full max-w-304">
          <Outlet />
        </div>
      </main>
      <div className="relative px-4 pb-8 text-center text-xs text-neutral-600 md:px-6">
        <AuthFooterNote />
      </div>
    </div>
  )
}
