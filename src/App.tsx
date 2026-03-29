import { BrowserRouter, Route, Routes } from "react-router"
import DashboardLayout from "./layouts/protected.layout"
import { ToastContainer } from "react-toastify"
import AllTradesPage from "./routes/trades"
import Wallets from "./routes/Wallets"
import DashboardPage from "./routes/dashboard"
import CopyTradingPage from "./routes/copy-trading"
import TradingBotPage from "./routes/trading-bot"
import InvestmentsPage from "./routes/investments"
import AffiliatePage from "./routes/affiliate"
import SettingsPage from "./routes/settings"
import VerificationPage from "./routes/verification"
import HelpPage from "./routes/help"
import LogoutPage from "./routes/logout"
import LiveTrading from "./routes/live-trading"

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<DashboardLayout />}>
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
