export type NavItem = {
  label: string
  path: string
  iconClass: string
  /** Use for index route `/` so other paths don't match */
  end?: boolean
}

export type NavGroup = {
  title: string
  items: NavItem[]
}

export const navGroups: NavGroup[] = [
  {
    title: 'Overview',
    items: [{ label: 'Dashboard', path: '/', iconClass: 'fi-rs-apps' }],
  },
  {
    title: 'Trade',
    items: [
      { label: 'Live trading', path: '/live-trading', iconClass: 'fi-rs-chart-candlestick', end: true },
      { label: 'Trade Center', path: '/trade-center', iconClass: 'fi-rs-apps' },
      { label: 'Copy trading', path: '/copy-trading', iconClass: 'fi-rs-clone' },
      { label: 'Trading bot', path: '/trading-bot', iconClass: 'fi-rs-robot' },
    ],
  },
  {
    title: 'Finance',
    items: [
      { label: 'Wallet', path: '/wallet', iconClass: 'fi-rs-wallet' },
      { label: 'Investments', path: '/investments', iconClass: 'fi-rs-chart-pie' },
    ],
  },
  {
    title: 'Program',
    items: [{ label: 'Affiliate', path: '/affiliate', iconClass: 'fi-rs-users-alt' }],
  },
  {
    title: 'Account',
    items: [
      { label: 'Settings', path: '/settings', iconClass: 'fi-rs-settings' },
      { label: 'Verification', path: '/verification', iconClass: 'fi-rs-shield-check' },
      { label: 'Help', path: '/help', iconClass: 'fi-rs-interrogation' },
    ],
  },
]
