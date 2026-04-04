import type { Hono } from 'hono'
import { and, eq, inArray, isNotNull } from 'drizzle-orm'
import type { Env } from '../types/env'
import type { AppVariables } from '../types/env'
import { requireAdmin } from '../middleware/admin'
import * as schema from '../db/schema'
import { getInternalUserIdByPublicId } from '../services/users-repo'

const REQUIRED_DOC_IDS = ['doc-passport', 'doc-address'] as const

export function registerAdminVerificationQueueRoutes(
  admin: Hono<{ Bindings: Env; Variables: AppVariables }>
): void {
  admin.get('/verification/queue', requireAdmin, async (c) => {
    const rows = await c.var.db
      .select({
        publicId: schema.users.publicId,
        email: schema.users.email,
        docId: schema.verificationDocuments.id,
        title: schema.verificationDocuments.title,
        subtitle: schema.verificationDocuments.subtitle,
        status: schema.verificationDocuments.status,
        updatedAt: schema.verificationDocuments.updatedAt,
        originalFilename: schema.verificationDocuments.originalFilename,
        mimeType: schema.verificationDocuments.mimeType,
        fileSize: schema.verificationDocuments.fileSize,
      })
      .from(schema.verificationDocuments)
      .innerJoin(schema.users, eq(schema.verificationDocuments.userId, schema.users.id))
      .where(
        and(
          inArray(schema.verificationDocuments.status, ['review', 'approved']),
          isNotNull(schema.verificationDocuments.r2Key)
        )
      )

    type Doc = {
      id: string
      title: string
      subtitle: string
      status: string
      updatedAt: number
      originalFilename: string | null
      mimeType: string | null
      fileSize: number | null
    }
    type Entry = { publicId: string; email: string; documents: Doc[] }
    const byPublic = new Map<string, Entry>()
    for (const r of rows) {
      let e = byPublic.get(r.publicId)
      if (!e) {
        e = { publicId: r.publicId, email: r.email, documents: [] }
        byPublic.set(r.publicId, e)
      }
      e.documents.push({
        id: r.docId,
        title: r.title,
        subtitle: r.subtitle,
        status: r.status,
        updatedAt: r.updatedAt,
        originalFilename: r.originalFilename ?? null,
        mimeType: r.mimeType ?? null,
        fileSize: r.fileSize ?? null,
      })
    }
    return c.json({ data: [...byPublic.values()] })
  })

  admin.get(
    '/verification/users/:publicId/documents/:documentId/download',
    requireAdmin,
    async (c) => {
      const publicId = c.req.param('publicId')
      const documentId = c.req.param('documentId')
      const internalId = await getInternalUserIdByPublicId(c.var.db, publicId)
      if (internalId == null) return c.json({ error: 'User not found' }, 404)

      const [doc] = await c.var.db
        .select()
        .from(schema.verificationDocuments)
        .where(
          and(
            eq(schema.verificationDocuments.id, documentId),
            eq(schema.verificationDocuments.userId, internalId)
          )
        )
        .limit(1)
      if (!doc?.r2Key) return c.json({ error: 'No file for this document' }, 404)

      const obj = await c.env.VERIFICATION_UPLOADS.get(doc.r2Key)
      if (!obj?.body) return c.json({ error: 'Stored file missing' }, 404)

      const filename = (doc.originalFilename ?? 'document').replace(/"/g, '')
      const headers = new Headers()
      headers.set('Content-Type', doc.mimeType || 'application/octet-stream')
      headers.set('Content-Disposition', `attachment; filename="${filename}"`)
      return new Response(obj.body, { headers })
    }
  )

  admin.post(
    '/verification/users/:publicId/documents/:documentId/approve',
    requireAdmin,
    async (c) => {
      const publicId = c.req.param('publicId')
      const documentId = c.req.param('documentId')
      const internalId = await getInternalUserIdByPublicId(c.var.db, publicId)
      if (internalId == null) return c.json({ error: 'User not found' }, 404)

      const [existing] = await c.var.db
        .select({ id: schema.verificationDocuments.id })
        .from(schema.verificationDocuments)
        .where(
          and(
            eq(schema.verificationDocuments.id, documentId),
            eq(schema.verificationDocuments.userId, internalId)
          )
        )
        .limit(1)
      if (!existing) return c.json({ error: 'Document not found' }, 404)

      const now = Math.floor(Date.now() / 1000)
      await c.var.db
        .update(schema.verificationDocuments)
        .set({ status: 'approved', updatedAt: now })
        .where(
          and(
            eq(schema.verificationDocuments.id, documentId),
            eq(schema.verificationDocuments.userId, internalId)
          )
        )

      const passportAddr = await c.var.db
        .select({ id: schema.verificationDocuments.id, status: schema.verificationDocuments.status })
        .from(schema.verificationDocuments)
        .where(
          and(
            eq(schema.verificationDocuments.userId, internalId),
            inArray(schema.verificationDocuments.id, [...REQUIRED_DOC_IDS])
          )
        )

      const byId = new Map(passportAddr.map((d) => [d.id, d.status]))
      const bothApproved =
        byId.get('doc-passport') === 'approved' && byId.get('doc-address') === 'approved'
      if (bothApproved) {
        await c.var.db
          .update(schema.users)
          .set({ verificationStatus: 3 })
          .where(eq(schema.users.id, internalId))
      }

      return c.json({ ok: true })
    }
  )

  admin.post(
    '/verification/users/:publicId/documents/:documentId/reject',
    requireAdmin,
    async (c) => {
      const publicId = c.req.param('publicId')
      const documentId = c.req.param('documentId')
      const internalId = await getInternalUserIdByPublicId(c.var.db, publicId)
      if (internalId == null) return c.json({ error: 'User not found' }, 404)

      const [doc] = await c.var.db
        .select()
        .from(schema.verificationDocuments)
        .where(
          and(
            eq(schema.verificationDocuments.id, documentId),
            eq(schema.verificationDocuments.userId, internalId)
          )
        )
        .limit(1)
      if (!doc) return c.json({ error: 'Document not found' }, 404)

      if (doc.r2Key) {
        try {
          await c.env.VERIFICATION_UPLOADS.delete(doc.r2Key)
        } catch {
          /* best-effort */
        }
      }

      const now = Math.floor(Date.now() / 1000)
      await c.var.db
        .update(schema.verificationDocuments)
        .set({
          status: 'missing',
          r2Key: null,
          originalFilename: null,
          mimeType: null,
          fileSize: null,
          updatedAt: now,
        })
        .where(
          and(
            eq(schema.verificationDocuments.id, documentId),
            eq(schema.verificationDocuments.userId, internalId)
          )
        )

      const [u] = await c.var.db
        .select({ vs: schema.users.verificationStatus })
        .from(schema.users)
        .where(eq(schema.users.id, internalId))
        .limit(1)
      if (u && u.vs >= 3) {
        await c.var.db
          .update(schema.users)
          .set({ verificationStatus: 2 })
          .where(eq(schema.users.id, internalId))
      }

      return c.json({ ok: true })
    }
  )
}
