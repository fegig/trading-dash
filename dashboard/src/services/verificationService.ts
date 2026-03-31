import type {
  VerificationBenefit,
  VerificationDocument,
  VerificationOverview,
  VerificationStep,
} from '../types/account'
import { get } from '../util/request'
import { endpoints } from './endpoints'

const apiBase = () =>
  import.meta.env.VITE_API_URL || import.meta.env.VITE_AUTH_API_BASE_URL || ''

export async function uploadVerificationDocument(
  documentId: string,
  file: File
): Promise<{ ok: boolean; error?: string }> {
  const url = `${apiBase()}${endpoints.verification.documentUpload(documentId)}`
  const body = new FormData()
  body.append('file', file)
  const headers: Record<string, string> = {}
  const token =
    typeof localStorage !== 'undefined' ? localStorage.getItem('token') : null
  if (token) headers.Authorization = `Bearer ${token}`
  const apiKey = import.meta.env.VITE_API_KEY
  if (apiKey) headers['x-api-key'] = apiKey

  const res = await fetch(url, {
    method: 'POST',
    body,
    credentials: 'include',
    headers,
  })
  if (!res.ok) {
    const data = (await res.json().catch(() => ({}))) as { error?: string }
    return { ok: false, error: data.error ?? res.statusText }
  }
  return { ok: true }
}

/** Triggers a browser download using session / Bearer (works with Vite proxy). */
export async function downloadVerificationDocument(
  documentId: string,
  suggestedFilename: string
): Promise<{ ok: boolean; error?: string }> {
  const url = `${apiBase()}${endpoints.verification.documentDownload(documentId)}`
  const headers: Record<string, string> = {}
  const token =
    typeof localStorage !== 'undefined' ? localStorage.getItem('token') : null
  if (token) headers.Authorization = `Bearer ${token}`
  const apiKey = import.meta.env.VITE_API_KEY
  if (apiKey) headers['x-api-key'] = apiKey

  const res = await fetch(url, { credentials: 'include', headers })
  if (!res.ok) {
    return { ok: false, error: (await res.text()) || res.statusText }
  }
  const blob = await res.blob()
  const name = suggestedFilename || 'document'
  const objUrl = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = objUrl
  a.download = name
  a.rel = 'noopener'
  a.click()
  URL.revokeObjectURL(objUrl)
  return { ok: true }
}

export async function getVerificationOverview(): Promise<VerificationOverview | null> {
  const data = await get(endpoints.verification.overview)
  if (data && typeof data === 'object' && 'tier' in data) {
    return data as VerificationOverview
  }
  return null
}

export async function getVerificationSteps(): Promise<VerificationStep[]> {
  const data = await get(endpoints.verification.steps)
  return Array.isArray(data) ? (data as VerificationStep[]) : []
}

export async function getVerificationDocuments(): Promise<VerificationDocument[]> {
  const data = await get(endpoints.verification.documents)
  return Array.isArray(data) ? (data as VerificationDocument[]) : []
}

export async function getVerificationBenefits(): Promise<VerificationBenefit[]> {
  const data = await get(endpoints.verification.benefits)
  return Array.isArray(data) ? (data as VerificationBenefit[]) : []
}
