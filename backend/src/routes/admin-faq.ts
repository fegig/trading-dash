import type { Hono } from 'hono'
import { z } from 'zod'
import { asc, desc, eq, sql } from 'drizzle-orm'
import type { Env } from '../types/env'
import type { AppVariables } from '../types/env'
import { requireAdmin } from '../middleware/admin'
import * as schema from '../db/schema'
import { listFaqCategoriesForApi, listFaqItemsForApi } from '../lib/faq-queries'

const catCreateSchema = z.object({
  name: z.string().min(1).max(128),
  sortOrder: z.number().int().optional(),
})

const catPatchSchema = z.object({
  name: z.string().min(1).max(128).optional(),
  sortOrder: z.number().int().optional(),
})

const itemCreateSchema = z.object({
  categoryId: z.number().int().positive(),
  question: z.string().min(1),
  answer: z.string().min(1),
  sortOrder: z.number().int().optional(),
})

const itemPatchSchema = z.object({
  question: z.string().min(1).optional(),
  answer: z.string().min(1).optional(),
  sortOrder: z.number().int().optional(),
  categoryId: z.number().int().positive().optional(),
})

export function registerAdminFaqRoutes(
  admin: Hono<{ Bindings: Env; Variables: AppVariables }>
): void {
  admin.get('/faq/categories', requireAdmin, async (c) => {
    const rows = await c.var.db
      .select()
      .from(schema.faqCategories)
      .orderBy(asc(schema.faqCategories.sortOrder))
    return c.json({ data: rows })
  })

  admin.post('/faq/categories', requireAdmin, async (c) => {
    let body: unknown
    try {
      body = await c.req.json()
    } catch {
      return c.json({ error: 'Invalid JSON' }, 400)
    }
    const parsed = catCreateSchema.safeParse(body)
    if (!parsed.success) return c.json({ error: parsed.error.flatten() }, 400)
    const [agg] = await c.var.db
      .select({ m: sql<number>`coalesce(max(${schema.faqCategories.sortOrder}), -1)` })
      .from(schema.faqCategories)
    const nextOrder = parsed.data.sortOrder ?? Number(agg?.m ?? -1) + 1
    await c.var.db.insert(schema.faqCategories).values({
      name: parsed.data.name,
      sortOrder: nextOrder,
    })
    const [row] = await c.var.db
      .select()
      .from(schema.faqCategories)
      .orderBy(desc(schema.faqCategories.id))
      .limit(1)
    return c.json({ data: row }, 201)
  })

  admin.patch('/faq/categories/:id', requireAdmin, async (c) => {
    const id = Number(c.req.param('id'))
    if (!Number.isFinite(id)) return c.json({ error: 'Invalid id' }, 400)
    let body: unknown
    try {
      body = await c.req.json()
    } catch {
      return c.json({ error: 'Invalid JSON' }, 400)
    }
    const parsed = catPatchSchema.safeParse(body)
    if (!parsed.success) return c.json({ error: parsed.error.flatten() }, 400)
    await c.var.db
      .update(schema.faqCategories)
      .set(parsed.data)
      .where(eq(schema.faqCategories.id, id))
    const [row] = await c.var.db
      .select()
      .from(schema.faqCategories)
      .where(eq(schema.faqCategories.id, id))
      .limit(1)
    if (!row) return c.json({ error: 'Not found' }, 404)
    return c.json({ data: row })
  })

  admin.delete('/faq/categories/:id', requireAdmin, async (c) => {
    const id = Number(c.req.param('id'))
    if (!Number.isFinite(id)) return c.json({ error: 'Invalid id' }, 400)
    await c.var.db.delete(schema.faqCategories).where(eq(schema.faqCategories.id, id))
    return c.json({ ok: true })
  })

  admin.get('/faq/items', requireAdmin, async (c) => {
    const catId = Number(c.req.query('categoryId'))
    if (!Number.isFinite(catId)) return c.json({ error: 'categoryId required' }, 400)
    const rows = await c.var.db
      .select()
      .from(schema.faqItems)
      .where(eq(schema.faqItems.categoryId, catId))
      .orderBy(asc(schema.faqItems.sortOrder))
    return c.json({ data: rows })
  })

  admin.post('/faq/items', requireAdmin, async (c) => {
    let body: unknown
    try {
      body = await c.req.json()
    } catch {
      return c.json({ error: 'Invalid JSON' }, 400)
    }
    const parsed = itemCreateSchema.safeParse(body)
    if (!parsed.success) return c.json({ error: parsed.error.flatten() }, 400)
    const [agg] = await c.var.db
      .select({ m: sql<number>`coalesce(max(${schema.faqItems.sortOrder}), -1)` })
      .from(schema.faqItems)
      .where(eq(schema.faqItems.categoryId, parsed.data.categoryId))
    const nextOrder = parsed.data.sortOrder ?? Number(agg?.m ?? -1) + 1
    await c.var.db.insert(schema.faqItems).values({
      categoryId: parsed.data.categoryId,
      question: parsed.data.question,
      answer: parsed.data.answer,
      sortOrder: nextOrder,
    })
    const [row] = await c.var.db
      .select()
      .from(schema.faqItems)
      .orderBy(desc(schema.faqItems.id))
      .limit(1)
    return c.json({ data: row }, 201)
  })

  admin.patch('/faq/items/:id', requireAdmin, async (c) => {
    const id = Number(c.req.param('id'))
    if (!Number.isFinite(id)) return c.json({ error: 'Invalid id' }, 400)
    let body: unknown
    try {
      body = await c.req.json()
    } catch {
      return c.json({ error: 'Invalid JSON' }, 400)
    }
    const parsed = itemPatchSchema.safeParse(body)
    if (!parsed.success) return c.json({ error: parsed.error.flatten() }, 400)
    await c.var.db.update(schema.faqItems).set(parsed.data).where(eq(schema.faqItems.id, id))
    const [row] = await c.var.db
      .select()
      .from(schema.faqItems)
      .where(eq(schema.faqItems.id, id))
      .limit(1)
    if (!row) return c.json({ error: 'Not found' }, 404)
    return c.json({ data: row })
  })

  admin.delete('/faq/items/:id', requireAdmin, async (c) => {
    const id = Number(c.req.param('id'))
    if (!Number.isFinite(id)) return c.json({ error: 'Invalid id' }, 400)
    await c.var.db.delete(schema.faqItems).where(eq(schema.faqItems.id, id))
    return c.json({ ok: true })
  })

  /** Legacy alias — same payload as `GET /public/faq/categories`. */
  admin.get('/getFAQcat', async (c) => {
    const data = await listFaqCategoriesForApi(c.var.db)
    return c.json({ data })
  })

  /** Legacy alias — `catInfo` added for landing help. */
  admin.get('/getFAQ', async (c) => {
    const catId = Number(c.req.query('catId'))
    if (!Number.isFinite(catId)) return c.json({ data: [], catInfo: null })
    const { catInfo, items } = await listFaqItemsForApi(c.var.db, catId)
    return c.json({ catInfo, data: items })
  })
}
