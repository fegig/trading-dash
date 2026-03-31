/** Max upload size for KYC documents (10 MB). */
export const VERIFICATION_MAX_UPLOAD_BYTES = 10 * 1024 * 1024

export const VERIFICATION_ALLOWED_MIME = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'application/pdf',
])

export function buildVerificationR2Key(
  userId: number,
  documentId: string,
  originalName: string
): string {
  const base = originalName.split(/[/\\]/).pop() ?? 'upload'
  const safe = base.replace(/[^a-zA-Z0-9._-]/g, '_').slice(0, 120) || 'file'
  return `users/${userId}/verification/${documentId}/${crypto.randomUUID()}-${safe}`
}
