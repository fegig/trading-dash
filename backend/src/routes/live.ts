import { Hono } from 'hono'
import { placeLiveOrderBodySchema, cancelLiveOrderBodySchema } from '@trading-dash/shared'
import type { Env } from '../types/env'
import type { AppVariables } from '../types/env'
import { requireUser } from '../middleware/session'

function normalizePair(pair: string): string {
  return pair.replace(/\//g, '-').toUpperCase()
}

const live = new Hono<{ Bindings: Env; Variables: AppVariables }>()

live.get('/ws/:pair', async (c) => {
  const pair = normalizePair(decodeURIComponent(c.req.param('pair')))
  const id = c.env.LIVE_TRADING.idFromName(pair)
  const stub = c.env.LIVE_TRADING.get(id)
  return stub.fetch(c.req.raw)
})

live.post('/orders', requireUser, async (c) => {
  const parsed = placeLiveOrderBodySchema.safeParse(await c.req.json().catch(() => ({})))
  if (!parsed.success) return c.json({ error: 'Invalid body', details: parsed.error.flatten() }, 400)
  const body = parsed.data
  const pair = normalizePair(body.pair)
  const id = c.env.LIVE_TRADING.idFromName(pair)
  const stub = c.env.LIVE_TRADING.get(id)
  const internalReq = new Request('https://live/internal/order', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      ...body,
      pair,
      userId: c.var.user!.id,
      userPublicId: c.var.user!.publicId,
    }),
  })
  return stub.fetch(internalReq)
})

live.post('/orders/cancel', requireUser, async (c) => {
  const parsed = cancelLiveOrderBodySchema.safeParse(await c.req.json().catch(() => ({})))
  if (!parsed.success) return c.json({ error: 'Invalid body' }, 400)
  const pair = normalizePair(parsed.data.pair)
  const id = c.env.LIVE_TRADING.idFromName(pair)
  const stub = c.env.LIVE_TRADING.get(id)
  const internalReq = new Request('https://live/internal/cancel', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ orderId: parsed.data.orderId }),
  })
  return stub.fetch(internalReq)
})

export { live as liveRoutes }
