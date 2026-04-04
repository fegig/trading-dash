import { Navigate, Outlet, useLocation } from "react-router"
import { useAuthStore } from "../stores"
import { userNeedsOnboarding } from "@/util/authFlow"
import GlobalNoticesBanner from "../components/GlobalNoticesBanner"
import Header from "./header"
import Footer from "./footer"
import SidebarMenu from "./sidebar"

function DashboardLayout() {
  const location = useLocation()
  const hydrated = useAuthStore((s) => s.hydrated)
  const isLoggedIn = useAuthStore((s) => s.isLoggedIn)
  const user = useAuthStore((s) => s.user)

  if (!hydrated) {
    return (
      <div className="min-h-dvh flex items-center justify-center bg-neutral-950 text-neutral-400 text-sm">
        Loading session…
      </div>
    )
  }

  if (!isLoggedIn) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />
  }

  if (user?.role === 'admin') {
    return <Navigate to="/admin" replace />
  }

  if (user && userNeedsOnboarding(user)) {
    return (
      <Navigate
        to="/onboarding"
        replace
        state={{
          userId: user.user_id,
          email: user.email,
          resume: true,
          prelimUser: user,
        }}
      />
    )
  }

  return (
    <div className="min-h-dvh flex flex-col bg-neutral-950 text-gray-100">
      <Header />
      <div className="flex flex-1 min-h-0 pt-14 relative overflow-hidden">
        <aside
          className="hidden lg:block fixed left-0 z-40 w-60 xl:w-64 top-14 bottom-12 border-r border-neutral-800 bg-neutral-950 overflow-y-auto scrollBar"
          aria-label="Sidebar navigation"
        >
          <div className="p-4 md:p-6 pr-3 md:pr-4">
            <SidebarMenu />
          </div>
        </aside>
        <main className="flex-1 min-w-0 min-h-0 overflow-y-auto scrollBar px-4 md:px-6 py-4 md:py-6 pb-12! lg:pl-66 xl:pl-72">
          <GlobalNoticesBanner />
          <Outlet />
        </main>
      </div>
      <Footer />
    </div>
  )
}

export default DashboardLayout
