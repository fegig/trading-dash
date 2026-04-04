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
    ],
  },
  {
    title: 'Users',
    items: [
      { label: 'All Users', path: '/admin/users', iconClass: 'fi-rr-users' },
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
    ],
  },
]
