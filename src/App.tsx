import { BrowserRouter, Route, Routes } from "react-router"
import Home from "./pages/Home"
import DashboardLayout from "./layouts/dashboardLayout"
import { ToastContainer } from "react-toastify"
import Wallets from "./pages/Wallets"
function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<DashboardLayout />}>
          <Route index element={<Home />} />
          <Route path="/wallet" element={<Wallets />} />
        </Route>
      </Routes>
      <ToastContainer />
    </BrowserRouter>
  )
}

export default App