import { createMiddleware } from 'hono/factory'
import type { Env, AppVariables } from '../types/env'

export const requireAdmin = createMiddleware<{ Bindings: Env; Variables: AppVariables }>(
  async (c, next) => {
    if (!c.var.user) {
      return c.json({ error: 'Unauthorized' }, 401)
    }
    if (c.var.user.role !== 'admin') {
      return c.json({ error: 'Forbidden' }, 403)
    }
    await next()
  }
)
