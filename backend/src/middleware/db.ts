import { createMiddleware } from 'hono/factory'
import { createDbContext, releaseDbContext } from '../db/client'
import type { Env } from '../types/env'
import type { AppVariables } from '../types/env'

export const dbMiddleware = createMiddleware<{ Bindings: Env; Variables: AppVariables }>(
  async (c, next) => {
    const ctx = await createDbContext(c.env.HYPERDRIVE.connectionString)
    c.set('db', ctx.db)
    c.set('dbConn', ctx.conn)
    try {
      await next()
    } finally {
      await releaseDbContext(ctx)
    }
  }
)
