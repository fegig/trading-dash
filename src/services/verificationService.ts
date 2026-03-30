import {
  mockVerificationBenefits,
  mockVerificationDocuments,
  mockVerificationOverview,
  mockVerificationSteps,
} from '../data/account'
import type {
  VerificationBenefit,
  VerificationDocument,
  VerificationOverview,
  VerificationStep,
} from '../types/account'

export async function getVerificationOverview(): Promise<VerificationOverview> {
  return { ...mockVerificationOverview }
}

export async function getVerificationSteps(): Promise<VerificationStep[]> {
  return mockVerificationSteps.map((step) => ({ ...step }))
}

export async function getVerificationDocuments(): Promise<VerificationDocument[]> {
  return mockVerificationDocuments.map((doc) => ({ ...doc }))
}

export async function getVerificationBenefits(): Promise<VerificationBenefit[]> {
  return mockVerificationBenefits.map((benefit) => ({ ...benefit }))
}
