import type {
  ActivityLogRow,
  SettingToggle,
  VerificationBenefit,
  VerificationDocument,
  VerificationOverview,
  VerificationStep,
} from '../types/account'

const now = Math.floor(Date.now() / 1000)

export const mockSettingsToggles: SettingToggle[] = [
  {
    id: 'two-factor-login',
    section: 'security',
    title: 'Two-factor login challenge',
    description: 'Require a second approval step when signing in from new devices.',
    enabled: true,
    icon: 'fi fi-rr-shield-check',
    tone: 'green',
  },
  {
    id: 'withdrawal-whitelist',
    section: 'security',
    title: 'Withdrawal address whitelist',
    description: 'Only allow withdrawals to approved wallet destinations.',
    enabled: true,
    icon: 'fi fi-rr-lock',
    tone: 'green',
  },
  {
    id: 'high-risk-confirmation',
    section: 'trading',
    title: 'High-risk trade confirmation',
    description: 'Prompt before orders that exceed your configured leverage or size thresholds.',
    enabled: true,
    icon: 'fi fi-rr-triangle-warning',
    tone: 'amber',
  },
  {
    id: 'copy-trading-pauses',
    section: 'trading',
    title: 'Auto-pause copy trading on drawdown',
    description: 'Stop mirrored allocations when lead traders hit your maximum drawdown tolerance.',
    enabled: true,
    icon: 'fi fi-rr-time-past',
    tone: 'amber',
  },
  {
    id: 'price-alerts',
    section: 'notifications',
    title: 'Price movement alerts',
    description: 'Send instant alerts when markets hit your watchlist thresholds.',
    enabled: true,
    icon: 'fi fi-rr-bell-ring',
    tone: 'sky',
  },
  {
    id: 'product-updates',
    section: 'notifications',
    title: 'Bot and investment updates',
    description: 'Notify you when product performance, pricing, or availability changes.',
    enabled: false,
    icon: 'fi fi-rr-megaphone',
    tone: 'sky',
  },
  {
    id: 'public-profile',
    section: 'privacy',
    title: 'Show profile in leaderboards',
    description: 'Display your nickname and aggregate performance on public ranking surfaces.',
    enabled: false,
    icon: 'fi fi-rr-eye',
    tone: 'rose',
  },
  {
    id: 'analytics-sharing',
    section: 'privacy',
    title: 'Share anonymous analytics',
    description: 'Help improve execution quality with fully anonymized product usage metrics.',
    enabled: true,
    icon: 'fi fi-rr-chart-histogram',
    tone: 'rose',
  },
]

export const mockActivityLogs: ActivityLogRow[] = [
  {
    id: 'log-1',
    time: now - 60 * 22,
    ipAddress: '102.89.44.18',
    location: 'Lagos, NG',
    device: 'Chrome on Windows',
    status: 'success',
  },
  {
    id: 'log-2',
    time: now - 60 * 60 * 5,
    ipAddress: '154.113.21.4',
    location: 'Abuja, NG',
    device: 'Safari on iPhone',
    status: 'review',
  },
  {
    id: 'log-3',
    time: now - 60 * 60 * 18,
    ipAddress: '41.90.77.12',
    location: 'Nairobi, KE',
    device: 'Edge on Windows',
    status: 'blocked',
  },
]

export const mockVerificationOverview: VerificationOverview = {
  tier: 'Tier 2 Verified',
  dailyLimit: '$250,000',
  payoutSpeed: 'Same-day fiat payouts',
  nextReview: 'Compliance refresh due in 45 days',
}

export const mockVerificationSteps: VerificationStep[] = [
  {
    id: 'identity',
    title: 'Identity confirmed',
    body: 'Government ID, liveness check, and sanctions screening all passed.',
    status: 'complete',
    eta: 'Completed',
    action: 'View summary',
  },
  {
    id: 'address',
    title: 'Proof of address on file',
    body: 'Utility bill and residency information verified for higher cash limits.',
    status: 'complete',
    eta: 'Completed',
    action: 'Replace document',
  },
  {
    id: 'enhanced',
    title: 'Enhanced source-of-funds tier',
    body: 'Optional review unlocks larger allocations for managed products and institutional access.',
    status: 'active',
    eta: '1 to 2 business days',
    action: 'Continue review',
  },
]

export const mockVerificationDocuments: VerificationDocument[] = [
  {
    id: 'doc-passport',
    title: 'Government ID',
    subtitle: 'International passport uploaded',
    status: 'approved',
    updatedAt: now - 60 * 60 * 24 * 31,
  },
  {
    id: 'doc-address',
    title: 'Proof of address',
    subtitle: 'Utility statement from February 2026',
    status: 'approved',
    updatedAt: now - 60 * 60 * 24 * 18,
  },
  {
    id: 'doc-source-funds',
    title: 'Source of funds',
    subtitle: 'Bank statement package awaiting review',
    status: 'review',
    updatedAt: now - 60 * 60 * 4,
  },
]

export const mockVerificationBenefits: VerificationBenefit[] = [
  {
    id: 'benefit-fiat',
    title: 'Larger fiat rails',
    body: 'Move capital faster between wallet funding and external bank settlement windows.',
    icon: 'fi fi-rr-badge-dollar',
  },
  {
    id: 'benefit-managed',
    title: 'Managed product access',
    body: 'Subscribe to premium bots, copy trading, and structured investments from one account.',
    icon: 'fi fi-rr-briefcase',
  },
  {
    id: 'benefit-priority',
    title: 'Priority reviews',
    body: 'Receive faster compliance handling when expanding into higher-capacity products.',
    icon: 'fi fi-rr-bolt',
  },
]
