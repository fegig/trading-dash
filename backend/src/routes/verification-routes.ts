import { Hono } from 'hono'
import { eq, asc, and } from 'drizzle-orm'
import type { Env } from '../types/env'
import type { AppVariables } from '../types/env'
import { requireUser } from '../middleware/session'
import * as schema from '../db/schema'
import {
  VERIFICATION_ALLOWED_MIME,
  VERIFICATION_MAX_UPLOAD_BYTES,
  buildVerificationR2Key,
} from '../services/verification-uploads'

/** Default KYC slots per user (ids must match dashboard upload paths). */
const DEFAULT_DOCUMENT_SLOTS: Array<{
  id: string
  title: string
  subtitle: string
}> = [
  {
    id: 'doc-passport',
    title: 'Government ID',
    subtitle: 'Passport, national ID, or driver license',
  },
  {
    id: 'doc-address',
    title: 'Proof of address',
    subtitle: 'Utility bill or bank statement (last 90 days)',
  },
  {
    id: 'doc-source-funds',
    title: 'Source of funds',
    subtitle: 'Bank or brokerage statements if requested for higher limits',
  },
]

async function ensureVerificationDocumentSlots(db: AppVariables['db'], userId: number): Promise<void> {
  const existing = await db
    .select({ id: schema.verificationDocuments.id })
    .from(schema.verificationDocuments)
    .where(eq(schema.verificationDocuments.userId, userId))
    .limit(1)
  if (existing.length > 0) return

  const now = Math.floor(Date.now() / 1000)
  await db.insert(schema.verificationDocuments).values(
    DEFAULT_DOCUMENT_SLOTS.map((slot) => ({
      id: slot.id,
      userId,
      title: slot.title,
      subtitle: slot.subtitle,
      status: 'missing' as const,
      updatedAt: now,
    }))
  )
}

const verification = new Hono<{ Bindings: Env; Variables: AppVariables }>()

verification.get('/overview', requireUser, async (c) => {
  const row = await c.var.db
    .select()
    .from(schema.verificationOverviewRows)
    .where(eq(schema.verificationOverviewRows.userId, c.var.user!.id))
    .limit(1)
  if (!row[0]) {
    return c.json({
      tier: 'Standard',
      dailyLimit: '$5,000',
      payoutSpeed: '1–2 business days',
      nextReview: 'Not scheduled',
    })
  }
  return c.json({
    tier: row[0].tier,
    dailyLimit: row[0].dailyLimit,
    payoutSpeed: row[0].payoutSpeed,
    nextReview: row[0].nextReview,
  })
})

verification.get('/steps', requireUser, async (c) => {
  const rows = await c.var.db
    .select()
    .from(schema.verificationSteps)
    .where(eq(schema.verificationSteps.userId, c.var.user!.id))
    .orderBy(asc(schema.verificationSteps.sortOrder))
  return c.json(
    rows.map((r) => ({
      id: r.id,
      title: r.title,
      body: r.body,
      status: r.status,
      eta: r.eta,
      action: r.action,
    }))
  )
})

verification.get('/documents', requireUser, async (c) => {
  const userId = c.var.user!.id
  await ensureVerificationDocumentSlots(c.var.db, userId)
  const rows = await c.var.db
    .select()
    .from(schema.verificationDocuments)
    .where(eq(schema.verificationDocuments.userId, userId))
  return c.json(
    rows.map((r) => ({
      id: r.id,
      title: r.title,
      subtitle: r.subtitle,
      status: r.status,
      updatedAt: r.updatedAt,
      hasFile: Boolean(r.r2Key),
      originalFilename: r.originalFilename ?? null,
      mimeType: r.mimeType ?? null,
      fileSize: r.fileSize ?? null,
    }))
  )
})

verification.post('/documents/:documentId/upload', requireUser, async (c) => {
  const documentId = c.req.param('documentId')
  const userId = c.var.user!.id
  await ensureVerificationDocumentSlots(c.var.db, userId)
  const bucket = c.env.VERIFICATION_UPLOADS

  const rows = await c.var.db
    .select()
    .from(schema.verificationDocuments)
    .where(
      and(
        eq(schema.verificationDocuments.id, documentId),
        eq(schema.verificationDocuments.userId, userId)
      )
    )
    .limit(1)
  const doc = rows[0]
  if (!doc) return c.json({ error: 'Document slot not found' }, 404)

  let form: FormData
  try {
    form = await c.req.formData()
  } catch {
    return c.json({ error: 'Expected multipart form data' }, 400)
  }

  const file = form.get('file')
  const isFileLike = (v: unknown): v is File =>
    typeof v === 'object' &&
    v !== null &&
    typeof (v as File).arrayBuffer === 'function' &&
    typeof (v as File).size === 'number'

  if (!isFileLike(file)) {
    return c.json({ error: 'Missing file field' }, 400)
  }

  if (file.size > VERIFICATION_MAX_UPLOAD_BYTES) {
    return c.json({ error: `File too large (max ${VERIFICATION_MAX_UPLOAD_BYTES} bytes)` }, 400)
  }

  const mime = (file.type || 'application/octet-stream').toLowerCase()
  if (!VERIFICATION_ALLOWED_MIME.has(mime)) {
    return c.json(
      { error: 'File type not allowed. Use JPEG, PNG, WebP, or PDF.' },
      415
    )
  }

  const buf = await file.arrayBuffer()
  const key = buildVerificationR2Key(userId, documentId, file.name)
  const oldKey = doc.r2Key

  await bucket.put(key, buf, {
    httpMetadata: { contentType: mime },
  })

  if (oldKey && oldKey !== key) {
    try {
      await bucket.delete(oldKey)
    } catch {
      /* best-effort cleanup */
    }
  }

  const now = Math.floor(Date.now() / 1000)
  await c.var.db
    .update(schema.verificationDocuments)
    .set({
      r2Key: key,
      originalFilename: file.name.slice(0, 500),
      mimeType: mime,
      fileSize: file.size,
      status: 'review',
      updatedAt: now,
    })
    .where(
      and(
        eq(schema.verificationDocuments.id, documentId),
        eq(schema.verificationDocuments.userId, userId)
      )
    )

  return c.json({ ok: true, documentId })
})

verification.get('/documents/:documentId/download', requireUser, async (c) => {
  const documentId = c.req.param('documentId')
  const userId = c.var.user!.id

  const rows = await c.var.db
    .select()
    .from(schema.verificationDocuments)
    .where(
      and(
        eq(schema.verificationDocuments.id, documentId),
        eq(schema.verificationDocuments.userId, userId)
      )
    )
    .limit(1)
  const doc = rows[0]
  if (!doc?.r2Key) return c.json({ error: 'No file uploaded for this document' }, 404)

  const obj = await c.env.VERIFICATION_UPLOADS.get(doc.r2Key)
  if (!obj?.body) return c.json({ error: 'Stored file missing' }, 404)

  const filename = (doc.originalFilename ?? 'document').replace(/"/g, '')
  const headers = new Headers()
  headers.set('Content-Type', doc.mimeType || 'application/octet-stream')
  headers.set('Content-Disposition', `attachment; filename="${filename}"`)

  return new Response(obj.body, { headers })
})

verification.get('/benefits', requireUser, async (c) => {
  const rows = await c.var.db
    .select()
    .from(schema.verificationBenefits)
    .where(eq(schema.verificationBenefits.userId, c.var.user!.id))
    .orderBy(asc(schema.verificationBenefits.sortOrder))
  return c.json(
    rows.map((r) => ({
      id: r.id,
      title: r.title,
      body: r.body,
      icon: r.icon,
    }))
  )
})

export { verification as verificationRoutes }
