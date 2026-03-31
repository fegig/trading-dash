import { create } from 'zustand'
import * as verificationService from '../services/verificationService'
import type {
  VerificationBenefit,
  VerificationDocument,
  VerificationOverview,
  VerificationStep,
} from '../types/account'

type VerificationState = {
  overview: VerificationOverview | null
  steps: VerificationStep[]
  documents: VerificationDocument[]
  benefits: VerificationBenefit[]
  loading: boolean
  loaded: boolean
  selectedDocumentId: string | null
  loadVerification: (force?: boolean) => Promise<void>
  selectDocument: (documentId: string | null) => void
  uploadVerificationFile: (
    documentId: string,
    file: File
  ) => Promise<{ ok: boolean; error?: string }>
  downloadVerificationFile: (
    documentId: string,
    filename: string
  ) => Promise<{ ok: boolean; error?: string }>
}

export const useVerificationStore = create<VerificationState>((set, get) => ({
  overview: null,
  steps: [],
  documents: [],
  benefits: [],
  loading: false,
  loaded: false,
  selectedDocumentId: null,
  loadVerification: async (force = false) => {
    if (!force && (get().loading || get().loaded)) return
    set({ loading: true })
    const [overview, steps, documents, benefits] = await Promise.all([
      verificationService.getVerificationOverview(),
      verificationService.getVerificationSteps(),
      verificationService.getVerificationDocuments(),
      verificationService.getVerificationBenefits(),
    ])
    set({
      overview,
      steps,
      documents,
      benefits,
      loading: false,
      loaded: true,
      selectedDocumentId: documents[0]?.id ?? null,
    })
  },
  selectDocument: (documentId) => set({ selectedDocumentId: documentId }),

  uploadVerificationFile: async (documentId, file) => {
    const result = await verificationService.uploadVerificationDocument(documentId, file)
    if (result.ok) {
      await get().loadVerification(true)
    }
    return result
  },

  downloadVerificationFile: async (documentId, filename) =>
    verificationService.downloadVerificationDocument(documentId, filename),
}))
