import { Hono } from 'hono'
import { cors } from 'hono/cors'
import type { Env } from './types/env'
import type { AppVariables } from './types/env'
import { dbMiddleware } from './middleware/db'
import { sessionMiddleware } from './middleware/session'
import { userRoutes } from './routes/user'
import { authRoutes } from './routes/auth'
import { walletRoutes } from './routes/wallet'
import { affiliateRoutes } from './routes/affiliate'
import { adminRoutes } from './routes/admin'
import { platformRoutes } from './routes/platform'
import { settingsRoutes } from './routes/settings'
import { verificationRoutes } from './routes/verification-routes'
import { liveRoutes } from './routes/live'
import { cryptoRoutes } from './routes/crypto'

export function createApp() {
  const app = new Hono<{ Bindings: Env; Variables: AppVariables }>()

  app.use('*', async (c, next) => {
    const origin = c.env.CORS_ORIGIN || 'http://localhost:4000'
    return cors({
      origin: origin.includes(',') ? origin.split(',').map((o) => o.trim()) : origin,
      allowHeaders: ['Content-Type', 'Authorization', 'x-api-key'],
      allowMethods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      credentials: true,
    })(c, next)
  })

  app.use('*', dbMiddleware)
  app.use('*', sessionMiddleware)

  app.get('/health', (c) => c.json({ ok: true }))

  app.route('/user', userRoutes)
  app.route('/auth', authRoutes)
  app.route('/wallet', walletRoutes)
  app.route('/affiliate', affiliateRoutes)
  app.route('/admin', adminRoutes)
  app.route('/platform', platformRoutes)
  app.route('/settings', settingsRoutes)
  app.route('/verification', verificationRoutes)
  app.route('/live', liveRoutes)
  app.route('/crypto', cryptoRoutes)

  return app
}
