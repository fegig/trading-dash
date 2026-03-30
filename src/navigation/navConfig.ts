export type NavItem = {
  label: string
  path: string
  iconClass: string
  end?: boolean
}

export type NavGroup = {
  title: string
  items: NavItem[]
}

export const navGroups: NavGroup[] = [
  {
    title: 'Overview',
    items: [{ label: 'Dashboard', path: '/dashboard', iconClass: 'fi-rs-apps' }],
  },
  {
    title: 'Trade',
    items: [
      { label: 'Live trading', path: '/dashboard/live-trading', iconClass: 'fi-rs-chart-candlestick', end: true },
      { label: 'Copy trading', path: '/dashboard/copy-trading', iconClass: 'fi-rs-clone' },
      { label: 'Trading bot', path: '/dashboard/trading-bot', iconClass: 'fi-rs-robot' },
    ],
  },
  {
    title: 'Finance',
    items: [
      { label: 'Wallet', path: '/dashboard/wallet', iconClass: 'fi-rs-wallet' },
      { label: 'Investments', path: '/dashboard/investments', iconClass: 'fi-rs-chart-pie' },
    ],
  },
  {
    title: 'Program',
    items: [{ label: 'Affiliate', path: '/dashboard/affiliate', iconClass: 'fi-rs-users-alt' }],
  },
  {
    title: 'Account',
    items: [
      { label: 'Settings', path: '/dashboard/settings', iconClass: 'fi-rs-settings' },
      { label: 'Verification', path: '/dashboard/verification', iconClass: 'fi-rs-shield-check' },
      { label: 'Help', path: '/dashboard/help', iconClass: 'fi-rs-interrogation' },
    ],
  },
]
