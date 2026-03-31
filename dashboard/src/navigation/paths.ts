/** Dashboard routes (nested under `/dashboard`). */
export const paths = {
  dashboard: '/dashboard',
  dashboardLiveTrading: '/dashboard/live-trading',
  dashboardTrades: '/dashboard/trades',
  dashboardWallet: '/dashboard/wallet',
  dashboardCopyTrading: '/dashboard/copy-trading',
  dashboardTradingBot: '/dashboard/trading-bot',
  dashboardInvestments: '/dashboard/investments',
  dashboardAffiliate: '/dashboard/affiliate',
  dashboardSettings: '/dashboard/settings',
  dashboardVerification: '/dashboard/verification',
  dashboardHelp: '/dashboard/help',
  dashboardLogout: '/dashboard/logout',
  /** Hub / trade center alias */
  dashboardHub: '/dashboard',
} as const
