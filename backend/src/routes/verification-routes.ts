import { Hono } from 'hono'
import { eq, and } from 'drizzle-orm'
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

/** Shown on the dashboard — always a full list, derived from account + document rows (no empty roadmap). */
function buildVerificationSteps(
  verificationStatus: number,
  docById: Map<string, 'approved' | 'review' | 'missing'>
): Array<{
  id: string
  title: string
  body: string
  status: 'complete' | 'active' | 'upcoming'
  eta: string
  action: string
}> {
  const st = (id: string) => docById.get(id) ?? 'missing'
  const uploaded = (id: string) => st(id) !== 'missing'
  const idApproved = st('doc-passport') === 'approved'
  const addrApproved = st('doc-address') === 'approved'
  const bothUploaded = uploaded('doc-passport') && uploaded('doc-address')

  const emailDone = verificationStatus >= 1

  return [
    {
      id: 'step-email',
      title: 'Verify your email',
      body: emailDone
        ? 'Your email address is confirmed.'
        : 'Open the link we sent when you signed up. You must confirm your email before identity verification.',
      status: emailDone ? 'complete' : 'active',
      eta: emailDone ? 'Done' : 'Required first',
      action: emailDone ? '—' : 'Check inbox or resend from Settings',
    },
    {
      id: 'step-identity',
      title: 'Government-issued ID',
      body: 'Passport, national ID, or driver licence — photo and details must be readable.',
      status: !emailDone
        ? 'upcoming'
        : idApproved || verificationStatus >= 3
          ? 'complete'
          : uploaded('doc-passport')
            ? 'complete'
            : 'active',
      eta:
        idApproved || verificationStatus >= 3
          ? 'Approved'
          : uploaded('doc-passport')
            ? st('doc-passport') === 'review'
              ? 'Team reviewing'
              : 'Received'
            : 'Not uploaded',
      action:
        idApproved || verificationStatus >= 3
          ? '—'
          : uploaded('doc-passport')
            ? 'Replace in Documents panel'
            : 'Upload in Documents panel →',
    },
    {
      id: 'step-address',
      title: 'Proof of address',
      body: 'Utility bill, bank statement, or official letter dated within the last 90 days.',
      status: !emailDone
        ? 'upcoming'
        : addrApproved || verificationStatus >= 3
          ? 'complete'
          : uploaded('doc-address')
            ? 'complete'
            : 'active',
      eta:
        addrApproved || verificationStatus >= 3
          ? 'Approved'
          : uploaded('doc-address')
            ? st('doc-address') === 'review'
              ? 'Team reviewing'
              : 'Received'
            : 'Not uploaded',
      action:
        addrApproved || verificationStatus >= 3
          ? '—'
          : uploaded('doc-address')
            ? 'Replace in Documents panel'
            : 'Upload in Documents panel →',
    },
    {
      id: 'step-review',
      title: 'We review your submission',
      body:
        verificationStatus >= 3
          ? 'Your profile is verified. Higher limits and full withdrawal options apply per your tier.'
          : verificationStatus === 2
            ? 'Our compliance team is reviewing your files. You will be notified when the status changes.'
            : bothUploaded
              ? 'Your documents are on file. Review typically starts within one business day after both required files are received.'
              : 'Upload the two required documents on the right. Optional: source-of-funds if we request it.',
      status:
        verificationStatus >= 3
          ? 'complete'
          : verificationStatus === 2 || (bothUploaded && verificationStatus === 1)
            ? 'active'
            : 'upcoming',
      eta:
        verificationStatus >= 3
          ? 'Verified'
          : verificationStatus === 2
            ? 'In progress'
            : bothUploaded
              ? 'Queued'
              : 'Waiting on uploads',
      action: '—',
    },
  ]
}

const DEFAULT_VERIFICATION_BENEFITS: Array<{
  id: string
  title: string
  body: string
  icon: string
}> = [
  {
    id: 'benefit-limits',
    title: 'Higher limits',
    body: 'Larger daily trading and withdrawal limits once your identity matches our compliance checks.',
    icon: 'fi fi-rr-chart-histogram',
  },
  {
    id: 'benefit-payouts',
    title: 'Smoother payouts',
    body: 'Fewer manual checks on withdrawals when your account is verified.',
    icon: 'fi fi-rr-bank',
  },
  {
    id: 'benefit-access',
    title: 'Full product access',
    body: 'Use funding, live desk, and partner products without verification holds.',
    icon: 'fi fi-rr-shield-check',
  },
]

const verification = new Hono<{ Bindings: Env; Variables: AppVariables }>()

verification.get('/overview', requireUser, async (c) => {
  const userId = c.var.user!.id
  const vs = c.var.user!.verificationStatus
  const row = await c.var.db
    .select()
    .from(schema.verificationOverviewRows)
    .where(eq(schema.verificationOverviewRows.userId, userId))
    .limit(1)
  if (!row[0]) {
    const tier = vs >= 3 ? 'Verified' : vs === 2 ? 'Under review' : 'Standard'
    return c.json({
      tier,
      dailyLimit: vs >= 3 ? '$50,000+' : vs === 2 ? 'As approved' : '$5,000',
      payoutSpeed: vs >= 3 ? 'Same day – 1 business day' : '1–2 business days',
      nextReview:
        vs >= 3 ? 'No review pending' : vs === 2 ? 'In progress' : 'After documents submitted',
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
  const userId = c.var.user!.id
  const vs = c.var.user!.verificationStatus
  await ensureVerificationDocumentSlots(c.var.db, userId)
  const docRows = await c.var.db
    .select({
      id: schema.verificationDocuments.id,
      status: schema.verificationDocuments.status,
    })
    .from(schema.verificationDocuments)
    .where(eq(schema.verificationDocuments.userId, userId))
  const docById = new Map(
    docRows.map((d) => [d.id, d.status as 'approved' | 'review' | 'missing'])
  )
  return c.json(buildVerificationSteps(vs, docById))
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
  return c.json(DEFAULT_VERIFICATION_BENEFITS)
})

export { verification as verificationRoutes }
