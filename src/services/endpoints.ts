/** Central API path segments — align with backend */
export const endpoints = {
  user: {
    getOtherBalance: '/user/getOtherBalance',
    wonLoss: '/user/wonLoss',
    getActivityLog: '/user/getActivityLog',
    getOpenTrades: '/user/getOpenTrades',
    getClosedTrades: '/user/getClosedTrades',
    closeTrade: '/user/closeTrade',
  },
  auth: {
    createToken: '/auth/createToken',
  },
  affiliate: {
    summary: '/affiliate/summary',
    referrals: '/affiliate/referrals',
  },
  wallet: {
    assets: '/wallet/assets',
    transactions: '/wallet/transactions',
  },
} as const
