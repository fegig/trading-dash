import type { Env } from '../types/env'

export const CC_DATA = 'https://min-api.cryptocompare.com/data'

/** Returns all configured CryptoCompare keys in priority order (primary first). */
function apiKeys(env: Env): string[] {
  return [env.CRYPTOCOMPARE_API_KEY, env.CRYPTOCOMPARE_API_KEY_2]
    .filter((k): k is string => typeof k === 'string' && k.trim().length > 0)
    .map((k) => k.trim())
}

function maxOutboundPerMinute(env: Env): number {
  const raw = env.CRYPTOCOMPARE_MAX_REQ_PER_MINUTE
  if (raw == null || raw === '') return 150
  const n = typeof raw === 'string' ? Number(raw.trim()) : Number(raw)
  return Number.isFinite(n) && n > 0 ? Math.floor(n) : 150
}

/** UTC minute bucket for KV counter keys (e.g. cc:out:202604171430). */
function outboundBudgetKvKey(nowMs: number): string {
  const d = new Date(nowMs)
  const y = d.getUTCFullYear()
  const mo = String(d.getUTCMonth() + 1).padStart(2, '0')
  const da = String(d.getUTCDate()).padStart(2, '0')
  const h = String(d.getUTCHours()).padStart(2, '0')
  const mi = String(d.getUTCMinutes()).padStart(2, '0')
  return `cc:out:${y}${mo}${da}${h}${mi}`
}

/**
 * Reserve one outbound CryptoCompare slot for this UTC minute.
 * Best-effort (KV is not strictly atomic); still caps runaway loops.
 */
async function consumeOutboundBudgetSlot(env: Env): Promise<void> {
  const kv = env.CRYPTO_CACHE
  if (!kv) return
  const max = maxOutboundPerMinute(env)
  const key = outboundBudgetKvKey(Date.now())
  try {
    const raw = await kv.get(key)
    const cur = Number(raw ?? '0')
    if (!Number.isFinite(cur) || cur >= max) {
      throw new Error('CryptoCompare outbound budget exceeded for this minute')
    }
    await kv.put(key, String(cur + 1), { expirationTtl: 120 })
  } catch (e) {
    if (e instanceof Error && e.message.includes('budget exceeded')) throw e
    /* ignore KV failures — do not block pricing */
  }
}

export async function cacheGet(env: Env, key: string): Promise<string | null> {
  const kv = env.CRYPTO_CACHE
  if (!kv) return null
  try {
    return await kv.get(key)
  } catch {
    return null
  }
}

export async function cachePut(env: Env, key: string, value: string, ttlSec: number): Promise<void> {
  const kv = env.CRYPTO_CACHE
  if (!kv) return
  try {
    await kv.put(key, value, { expirationTtl: ttlSec })
  } catch {
    /* ignore */
  }
}

function isCryptoCompareErrorBody(data: unknown): boolean {
  if (!data || typeof data !== 'object') return false
  return (data as { Response?: string }).Response === 'Error'
}

/**
 * Cache-first JSON fetch from CryptoCompare.
 *
 * `makeUrl(apiKey)` — pass `null` for a keyless URL (no `api_key` query param).
 * When at least one API key exists, a keyless attempt is tried first; on
 * 429 / 401 / 5xx or JSON `Response: "Error"`, keyed URLs are tried in order.
 * With no keys configured, only the keyless URL is attempted.
 *
 * Each real `fetch()` counts against a per-minute KV budget (default 150/min).
 */
export async function cachedFetchCryptoCompareJson(
  env: Env,
  cacheKey: string,
  ttlSec: number,
  makeUrl: (apiKey: string | null) => string,
): Promise<unknown> {
  const hit = await cacheGet(env, cacheKey)
  if (hit) {
    try {
      const parsed = JSON.parse(hit) as unknown
      if (!isCryptoCompareErrorBody(parsed)) return parsed
    } catch {
      /* cache corrupt — refetch */
    }
  }

  const keys = apiKeys(env)
  const tryOrder: Array<string | null> = keys.length > 0 ? [null, ...keys] : [null]

  let lastErr: Error | null = null
  for (const apiKey of tryOrder) {
    try {
      await consumeOutboundBudgetSlot(env)
      const res = await fetch(makeUrl(apiKey))
      if (res.status === 429 || res.status === 401 || res.status >= 500) {
        lastErr = new Error(`CryptoCompare HTTP ${res.status}`)
        continue
      }
      if (!res.ok) {
        lastErr = new Error(`CryptoCompare HTTP ${res.status}`)
        continue
      }
      const data: unknown = await res.json()
      if (isCryptoCompareErrorBody(data)) {
        const msg =
          typeof (data as { Message?: string }).Message === 'string'
            ? (data as { Message: string }).Message
            : 'CryptoCompare error response'
        lastErr = new Error(msg)
        continue
      }
      await cachePut(env, cacheKey, JSON.stringify(data), ttlSec)
      return data
    } catch (e) {
      if (e instanceof Error && e.message.includes('budget exceeded')) throw e
      lastErr = e instanceof Error ? e : new Error(String(e))
    }
  }
  throw lastErr ?? new Error('All CryptoCompare fetch attempts failed')
}

export type UsdSpot = { usd: number; changePct24h: number }

/** Batch spot vs USD + 24h % change for wallet pricing (fiat ISO codes work for many pairs on CC). */
export async function fetchUsdSpots(env: Env, symbols: string[]): Promise<Map<string, UsdSpot>> {
  const uniq = [...new Set(symbols.map((s) => s.toUpperCase().trim()).filter(Boolean))]
  if (uniq.length === 0) return new Map()

  const fsyms = uniq.join(',')
  const cacheKey = `cc:walletusd:${fsyms}`

  try {
    const data = (await cachedFetchCryptoCompareJson(
      env,
      cacheKey,
      120,
      (k) => {
        const q = `fsyms=${encodeURIComponent(fsyms)}&tsyms=USD`
        return k
          ? `${CC_DATA}/pricemultifull?${q}&api_key=${encodeURIComponent(k)}`
          : `${CC_DATA}/pricemultifull?${q}`
      },
    )) as {
      RAW?: Record<string, { USD?: { PRICE?: number; CHANGEPCT24HOUR?: number } }>
    }
    const out = new Map<string, UsdSpot>()
    const raw = data.RAW ?? {}
    for (const sym of uniq) {
      const node = raw[sym]?.USD
      if (node && typeof node.PRICE === 'number' && Number.isFinite(node.PRICE) && node.PRICE > 0) {
        out.set(sym, {
          usd: node.PRICE,
          changePct24h:
            typeof node.CHANGEPCT24HOUR === 'number' && Number.isFinite(node.CHANGEPCT24HOUR)
              ? node.CHANGEPCT24HOUR
              : 0,
        })
      }
    }
    return out
  } catch {
    return new Map()
  }
}

/** Single-asset spot vs USD (uses same CryptoCompare batch helper as the wallet). */
export async function fetchSpotUsdForBase(env: Env, base: string): Promise<number | null> {
  const sym = base.trim().toUpperCase()
  if (!sym) return null
  const m = await fetchUsdSpots(env, [sym])
  const spot = m.get(sym)
  return spot && spot.usd > 0 && Number.isFinite(spot.usd) ? spot.usd : null
}
