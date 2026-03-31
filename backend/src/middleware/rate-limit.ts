import { createMiddleware } from 'hono/factory'
import type { Env } from '../types/env'

const memoryBuckets = new Map<string, number[]>()

const KV_KEY = (k: string) => `rl:${k}`

/** Sliding window: keep timestamps in windowMs; allow up to limit hits */
export async function slidingWindowAllow(
  env: Env,
  key: string,
  limit: number,
  windowSec: number
): Promise<boolean> {
  const now = Date.now()
  const windowMs = windowSec * 1000

  if (env.RATE_LIMIT) {
    const raw = await env.RATE_LIMIT.get(KV_KEY(key))
    let ts: number[] = []
    if (raw) {
      try {
        ts = JSON.parse(raw) as number[]
      } catch {
        ts = []
      }
    }
    ts = ts.filter((t) => now - t < windowMs)
    if (ts.length >= limit) return false
    ts.push(now)
    await env.RATE_LIMIT.put(KV_KEY(key), JSON.stringify(ts), {
      expirationTtl: windowSec + 5,
    })
    return true
  }

  let arr = memoryBuckets.get(key) ?? []
  arr = arr.filter((t) => now - t < windowMs)
  if (arr.length >= limit) return false
  arr.push(now)
  memoryBuckets.set(key, arr)
  return true
}

export function rateLimitMiddleware(opts: {
  limit: number
  windowSec: number
  keyPrefix: string
  keyFrom: (c: { req: { header: (n: string) => string | undefined } }) => string
}) {
  return createMiddleware<{ Bindings: Env }>(async (c, next) => {
    const ip = c.req.header('cf-connecting-ip') ?? c.req.header('x-forwarded-for') ?? 'unknown'
    const part = opts.keyFrom(c)
    const key = `${opts.keyPrefix}:${part}:${ip}`
    const ok = await slidingWindowAllow(c.env, key, opts.limit, opts.windowSec)
    if (!ok) {
      return c.json({ error: 'Too many requests' }, 429)
    }
    await next()
  })
}
