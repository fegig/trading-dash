import { and, desc, eq, gt, isNull, or } from 'drizzle-orm'
import type { AppVariables } from '../types/env'
import * as schema from '../db/schema'

type Db = AppVariables['db']

const NOTICE_TTL_SEC = 90 * 86400

export async function insertGlobalNotice(
  db: Db,
  input: {
    kind: string
    title: string
    body: string
    meta?: Record<string, unknown>
    /** Optional absolute expiry (unix sec). */
    expiresAt?: number | null
  }
): Promise<string> {
  const id = crypto.randomUUID()
  const now = Math.floor(Date.now() / 1000)
  await db.insert(schema.globalNotices).values({
    id,
    kind: input.kind,
    title: input.title,
    body: input.body,
    metaJson: input.meta ? JSON.stringify(input.meta) : null,
    createdAt: now,
    expiresAt: input.expiresAt ?? null,
  })
  return id
}

export type NoticeDto = {
  id: string
  kind: string
  title: string
  body: string
  meta: Record<string, unknown> | null
  createdAt: number
}

export async function listActiveNoticesForUser(db: Db, userId: number): Promise<NoticeDto[]> {
  const now = Math.floor(Date.now() / 1000)
  const cutoff = now - NOTICE_TTL_SEC

  const dismissed = await db
    .select({ noticeId: schema.userNoticeDismissals.noticeId })
    .from(schema.userNoticeDismissals)
    .where(eq(schema.userNoticeDismissals.userId, userId))
  const disSet = new Set(dismissed.map((d) => d.noticeId))

  const rows = await db
    .select()
    .from(schema.globalNotices)
    .where(
      and(
        gt(schema.globalNotices.createdAt, cutoff),
        or(isNull(schema.globalNotices.expiresAt), gt(schema.globalNotices.expiresAt, now))
      )
    )
    .orderBy(desc(schema.globalNotices.createdAt))

  return rows
    .filter((n) => !disSet.has(n.id))
    .map((n) => ({
      id: n.id,
      kind: n.kind,
      title: n.title,
      body: n.body,
      meta: n.metaJson
        ? (() => {
            try {
              return JSON.parse(n.metaJson) as Record<string, unknown>
            } catch {
              return null
            }
          })()
        : null,
      createdAt: n.createdAt,
    }))
}

export async function dismissNotice(db: Db, userId: number, noticeId: string): Promise<void> {
  const now = Math.floor(Date.now() / 1000)
  await db
    .insert(schema.userNoticeDismissals)
    .values({ userId, noticeId, dismissedAt: now })
    .onDuplicateKeyUpdate({ set: { dismissedAt: now } })
}
