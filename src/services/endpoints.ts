/** Central API path segments — align with backend */
export const endpoints = {
  user: {
    getOtherBalance: '/user/getOtherBalance',
    wonLoss: '/user/wonLoss',
    getActivityLog: '/user/getActivityLog',
    getOpenTrades: '/user/getOpenTrades',
    getClosedTrades: '/user/getClosedTrades',
    closeTrade: '/user/closeTrade',
    login: '/user/login',
    getFiat: '/user/getFiat',
    getVerificationStatus: '/user/getVerificationStatus',
    updateUserStatus: '/user/updateUserStatus',
    addBios: '/user/addBios',
    getAllFiats: '/user/getAllFiats',
    updateCurrency: '/user/updateCurrency',
    addAdminWallet: '/user/addAdminWallet',
  },
  auth: {
    createToken: '/auth/createToken',
    sendOTP: '/auth/sendOTP',
    verifyOTP: '/auth/verifyOTP',
    register: '/auth/register',
    regRefferal: '/auth/regRefferal',
    passwordReset: '/auth/passwordReset',
    verifyToken: '/auth/verifyToken',
  },
  affiliate: {
    summary: '/affiliate/summary',
    referrals: '/affiliate/referrals',
  },
  wallet: {
    assets: '/wallet/assets',
    transactions: '/wallet/transactions',
  },
  admin: {
    faqCategories: '/admin/getFAQcat',
    faqByCategory: (catId: number) => `/admin/getFAQ?catId=${catId}`,
  },
  mailer: {
    emailOtp: (mailTo: string, token: string) =>
      `/mailer/emailOTP?mailTo=${encodeURIComponent(mailTo)}&token=${encodeURIComponent(token)}`,
    verificationEmail: (
      mailTo: string,
      userId: number | string,
      token: string,
      userName?: string
    ) => {
      let q = `/mailer/verificationemail?mailTo=${encodeURIComponent(mailTo)}&userid=${userId}&token=${token}`
      if (userName !== undefined && userName !== '') {
        q += `&userName=${encodeURIComponent(userName)}`
      }
      return q
    },
    loginNotification: (
      userMail: string,
      userId: number | string,
      device: string,
      time: string
    ) =>
      `/mailer/loginNotification?userMail=${encodeURIComponent(userMail)}&userId=${userId}&device=${encodeURIComponent(device)}&time=${encodeURIComponent(time)}`,
  },
} as const
