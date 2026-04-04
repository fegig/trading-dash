export type AdminNavItem = {
  label: string
  path: string
  iconClass: string
  end?: boolean
}

export type AdminNavGroup = {
  title: string
  items: AdminNavItem[]
}

export const adminNavGroups: AdminNavGroup[] = [
  {
    title: 'Overview',
    items: [
      { label: 'Dashboard', path: '/admin', iconClass: 'fi-rr-apps', end: true },
      { label: 'Settings', path: '/admin/settings', iconClass: 'fi-rr-settings' },
    ],
  },
  {
    title: 'Users',
    items: [
      { label: 'All Users', path: '/admin/users', iconClass: 'fi-rr-users' },
      { label: 'Verification queue', path: '/admin/verification', iconClass: 'fi-rr-id-badge' },
    ],
  },
  {
    title: 'Trading',
    items: [
      { label: 'Trades', path: '/admin/trades', iconClass: 'fi-rr-chart-candlestick' },
      { label: 'Trading Bots', path: '/admin/bots', iconClass: 'fi-rr-robot' },
      { label: 'Copy Traders', path: '/admin/copy-traders', iconClass: 'fi-rr-copy-alt' },
    ],
  },
  {
    title: 'Finance',
    items: [
      { label: 'Investments', path: '/admin/investments', iconClass: 'fi-rr-chart-pie' },
      { label: 'Wallet pending', path: '/admin/wallet/pending', iconClass: 'fi-rr-time-past' },
    ],
  },
  {
    title: 'Catalog',
    items: [
      { label: 'Coins', path: '/admin/catalog/coins', iconClass: 'fi-rr-coins' },
      { label: 'Fiat currencies', path: '/admin/catalog/fiat', iconClass: 'fi-rr-bank' },
    ],
  },
  {
    title: 'Content',
    items: [{ label: 'FAQ', path: '/admin/faq', iconClass: 'fi-rr-interrogation' }],
  },
]
