import { Outlet } from "react-router"
import Header from "./header"
import Footer from "./footer"

function DashboardLayout() {
  return (
    <div className="min-h-screen bg-neutral-950 text-gray-100">
        <Header />
        <Outlet />
        <Footer />
    </div>
  )

}


export default DashboardLayout