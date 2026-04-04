import { get } from '../util/request'
import { endpoints } from './endpoints'

/** Public FAQ — no login required (same data as legacy `/admin/getFAQ*`). */
export async function fetchFaqCategories<T = { data?: unknown[] }>() {
  const body = await get<T>(endpoints.public.faqCategories)
  return { data: body }
}

export async function fetchFaqByCategory<T = unknown>(catId: number) {
  const body = await get<T>(endpoints.public.faqItems(catId))
  return { data: body }
}
