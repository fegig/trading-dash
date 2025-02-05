import { BrowserRouter, Route, Routes } from "react-router"
import Home from "./pages/Home"
import DashboardLayout from "./layouts/dashboardLayout"
import { ToastContainer } from "react-toastify"

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<DashboardLayout />}>
          <Route index element={<Home />} />
        </Route>
      </Routes>
      <ToastContainer />
    </BrowserRouter>
  )
}

export default App