import { authGet } from './authClient'
import { endpoints } from './endpoints'

export async function fetchFaqCategories<T = { data?: unknown[] }>() {
  return authGet<T>(endpoints.admin.faqCategories)
}

export async function fetchFaqByCategory<T = unknown>(catId: number) {
  return authGet<T>(endpoints.admin.faqByCategory(catId))
}
