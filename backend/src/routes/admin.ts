import { Hono } from 'hono'
import { eq, asc } from 'drizzle-orm'
import type { Env } from '../types/env'
import type { AppVariables } from '../types/env'
import * as schema from '../db/schema'

const admin = new Hono<{ Bindings: Env; Variables: AppVariables }>()

admin.get('/getFAQcat', async (c) => {
  const rows = await c.var.db
    .select()
    .from(schema.faqCategories)
    .orderBy(asc(schema.faqCategories.sortOrder))
  return c.json({
    data: rows.map((r) => ({ id: r.id, name: r.name })),
  })
})

admin.get('/getFAQ', async (c) => {
  const catId = Number(c.req.query('catId'))
  if (!Number.isFinite(catId)) return c.json({ data: [] })

  const rows = await c.var.db
    .select()
    .from(schema.faqItems)
    .where(eq(schema.faqItems.categoryId, catId))
    .orderBy(asc(schema.faqItems.sortOrder))

  return c.json({
    data: rows.map((r) => ({
      id: r.id,
      question: r.question,
      answer: r.answer,
    })),
  })
})

export { admin as adminRoutes }
