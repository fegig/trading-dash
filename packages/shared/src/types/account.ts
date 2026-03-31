export type SettingSectionId = 'security' | 'trading' | 'notifications' | 'privacy'

export type SettingTone = 'green' | 'sky' | 'amber' | 'rose'

export type SettingToggle = {
  id: string
  section: SettingSectionId
  title: string
  description: string
  enabled: boolean
  icon: string
  tone: SettingTone
}

export type ActivityLogRow = {
  id: string
  time: number
  ipAddress: string
  location: string
  device: string
  status: 'success' | 'review' | 'blocked'
}

export type VerificationStepStatus = 'complete' | 'active' | 'upcoming'

export type VerificationDocumentStatus = 'approved' | 'review' | 'missing'

export type VerificationStep = {
  id: string
  title: string
  body: string
  status: VerificationStepStatus
  eta: string
  action: string
}

export type VerificationDocument = {
  id: string
  title: string
  subtitle: string
  status: VerificationDocumentStatus
  updatedAt: number
  /** True when a file is stored (R2) */
  hasFile?: boolean
  originalFilename?: string | null
  mimeType?: string | null
  fileSize?: number | null
}

export type VerificationBenefit = {
  id: string
  title: string
  body: string
  icon: string
}

export type VerificationOverview = {
  tier: string
  dailyLimit: string
  payoutSpeed: string
  nextReview: string
}
