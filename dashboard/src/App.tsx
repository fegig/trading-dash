import { BrowserRouter, Route, Routes } from 'react-router'
import { ToastContainer } from 'react-toastify'
import { AuthBootstrap } from './components/AuthBootstrap'
import CookieConsent from './components/common/CookieConsent'
import SmoothScroll from './components/common/SmoothScroll'
import DashboardLayout from './layouts/protected.layout'
import AdminLayout from './layouts/admin.layout'
import LandingLayout from './layouts/landing.layout'
import AuthLayout from './layouts/auth.layout'
import HomePage from './routes/landing/HomePage'
import AboutPage from './routes/landing/AboutPage'
import MarketPage from './routes/landing/MarketPage'
import HelpPage from './routes/landing/HelpPage'
import HelpCategoryPage from './routes/landing/HelpCategoryPage'
import InsightsPage from './routes/landing/InsightsPage'
import LoginPage from './routes/auth/LoginPage'
import RegisterPage from './routes/auth/RegisterPage'
import ForgotPage from './routes/auth/ForgotPage'
import VerifyEmailPage from './routes/auth/VerifyEmailPage'
import ConfirmEmailPage from './routes/auth/ConfirmEmailPage'
import LoginOtpPage from './routes/auth/LoginOtpPage'
import OnboardingPage from './routes/auth/OnboardingPage'
import NotFoundPage from './routes/NotFound'
import AdminDashboardPage from './routes/admin/AdminDashboardPage'
import AdminUsersPage from './routes/admin/AdminUsersPage'
import AdminUserDetailPage from './routes/admin/AdminUserDetailPage'
import AdminTradesPage from './routes/admin/AdminTradesPage'
import AdminBotsPage from './routes/admin/AdminBotsPage'
import AdminCopyTradersPage from './routes/admin/AdminCopyTradersPage'
import AdminInvestmentsPage from './routes/admin/AdminInvestmentsPage'
import AdminCatalogCoinsPage from './routes/admin/AdminCatalogCoinsPage'
import AdminCatalogFiatPage from './routes/admin/AdminCatalogFiatPage'
import AdminSettingsPage from './routes/admin/AdminSettingsPage'
import AdminVerificationPage from './routes/admin/AdminVerificationPage'
import AdminFaqPage from './routes/admin/AdminFaqPage'
import AllTradesPage from './routes/dashboard/trades'
import Wallets from './routes/dashboard/Wallets'
import DashboardPage from './routes/dashboard/dashboard'
import CopyTradingPage from './routes/dashboard/copy-trading'
import TradingBotPage from './routes/dashboard/trading-bot'
import InvestmentsPage from './routes/dashboard/investments'
import AffiliatePage from './routes/dashboard/affiliate'
import SettingsPage from './routes/dashboard/settings'
import VerificationPage from './routes/dashboard/verification'
import HelpPageDash from './routes/dashboard/help'
import LogoutPage from './routes/dashboard/logout'
import LiveTrading from './routes/dashboard/live-trading'

function App() {
  return (
    <BrowserRouter>
      <SmoothScroll />
      <CookieConsent />
      <AuthBootstrap>
        <Routes>
          <Route element={<LandingLayout />}>
            <Route index element={<HomePage />} />
            <Route path="about" element={<AboutPage />} />
            <Route path="market" element={<MarketPage />} />
            <Route path="help" element={<HelpPage />} />
            <Route path="help/:id" element={<HelpCategoryPage />} />
            <Route path="insights" element={<InsightsPage />} />
          </Route>

          <Route element={<AuthLayout />}>
            <Route path="login" element={<LoginPage />} />
            <Route path="login/otp" element={<LoginOtpPage />} />
            <Route path="register" element={<RegisterPage />} />
            <Route path="verify" element={<VerifyEmailPage />} />
            <Route path="confirm/:email/:id/:userId" element={<ConfirmEmailPage />} />
            <Route path="forgot" element={<ForgotPage />} />
            <Route path="onboarding" element={<OnboardingPage />} />
          </Route>

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
            <Route path="help" element={<HelpPageDash />} />
            <Route path="logout" element={<LogoutPage />} />
          </Route>

          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<AdminDashboardPage />} />
            <Route path="users" element={<AdminUsersPage />} />
            <Route path="users/:id" element={<AdminUserDetailPage />} />
            <Route path="trades" element={<AdminTradesPage />} />
            <Route path="bots" element={<AdminBotsPage />} />
            <Route path="copy-traders" element={<AdminCopyTradersPage />} />
            <Route path="investments" element={<AdminInvestmentsPage />} />
            <Route path="catalog/coins" element={<AdminCatalogCoinsPage />} />
            <Route path="catalog/fiat" element={<AdminCatalogFiatPage />} />
            <Route path="settings" element={<AdminSettingsPage />} />
            <Route path="verification" element={<AdminVerificationPage />} />
            <Route path="faq" element={<AdminFaqPage />} />
          </Route>

          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </AuthBootstrap>
      <ToastContainer />
    </BrowserRouter>
  )
}

export default App
