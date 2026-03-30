import { BrowserRouter, Route, Routes } from "react-router"
import DashboardLayout from "./layouts/protected.layout"
import { ToastContainer } from "react-toastify"
import AllTradesPage from "./routes/dashboard/trades"
import Wallets from "./routes/dashboard/Wallets"
import DashboardPage from "./routes/dashboard/dashboard"
import CopyTradingPage from "./routes/dashboard/copy-trading"
import TradingBotPage from "./routes/dashboard/trading-bot"
import InvestmentsPage from "./routes/dashboard/investments"
import AffiliatePage from "./routes/dashboard/affiliate"
import SettingsPage from "./routes/dashboard/settings"
import VerificationPage from "./routes/dashboard/verification"
import HelpPage from "./routes/dashboard/help"
import LogoutPage from "./routes/dashboard/logout"
import LiveTrading from "./routes/dashboard/live-trading"

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/dashboard" element={<DashboardLayout />}>
          <Route index element={<DashboardPage />} />
          <Route path="live-trading" element={<LiveTrading />} />
          <Route path="trades" element={<AllTradesPage />} />
          <Route path="wallet" element={<Wallets />} /> 
          <Route path="copy-trading" element={<CopyTradingPage />} />
          <Route path="trading-bot" element={<TradingBotPage />} />
          <Route path="investments" element={<InvestmentsPage />} />
          <Route path="affiliate" element={<AffiliatePage />} />
          <Route path="settings" element={<SettingsPage />} />
          <Route path="verification" element={<VerificationPage />} />
          <Route path="help" element={<HelpPage />} />
          <Route path="logout" element={<LogoutPage />} />
        </Route>
      </Routes>
      <ToastContainer />
    </BrowserRouter>
  )
}

export default App
