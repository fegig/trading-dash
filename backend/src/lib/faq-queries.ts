import { asc, eq } from 'drizzle-orm'
import type { AppVariables } from '../types/env'
import * as schema from '../db/schema'

type Db = AppVariables['db']

export async function listFaqCategoriesForApi(db: Db) {
  const rows = await db
    .select()
    .from(schema.faqCategories)
    .orderBy(asc(schema.faqCategories.sortOrder))
  return rows.map((r) => ({ id: r.id, name: r.name }))
}

export async function listFaqItemsForApi(db: Db, catId: number) {
  const [cat] = await db
    .select()
    .from(schema.faqCategories)
    .where(eq(schema.faqCategories.id, catId))
    .limit(1)

  const rows = await db
    .select()
    .from(schema.faqItems)
    .where(eq(schema.faqItems.categoryId, catId))
    .orderBy(asc(schema.faqItems.sortOrder))

  return {
    catInfo: cat ? { id: cat.id, name: cat.name } : null,
    items: rows.map((r) => ({
      id: r.id,
      question: r.question,
      answer: r.answer,
    })),
  }
}
