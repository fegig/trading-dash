import { Outlet } from "react-router"
import Header from "./header"
import Footer from "./footer"
import SidebarMenu from "./sidebar"

function DashboardLayout() {
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
        <main className="flex-1 min-w-0 min-h-0 overflow-y-auto scrollBar px-4 md:px-6 py-4 md:py-6 pb-24 lg:pl-66 xl:pl-72">
          <Outlet />
        </main>
      </div>
      <Footer />
    </div>
  )
}

export default DashboardLayout
