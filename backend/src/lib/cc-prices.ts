import type { Env } from '../types/env'

const CC_DATA = 'https://min-api.cryptocompare.com/data'

/** Returns all configured CryptoCompare keys in priority order (primary first). */
function apiKeys(env: Env): string[] {
  return [env.CRYPTOCOMPARE_API_KEY, env.CRYPTOCOMPARE_API_KEY_2]
    .filter((k): k is string => typeof k === 'string' && k.trim().length > 0)
    .map((k) => k.trim())
}

async function cacheGet(env: Env, key: string): Promise<string | null> {
  const kv = env.CRYPTO_CACHE
  if (!kv) return null
  try {
    return await kv.get(key)
  } catch {
    return null
  }
}

async function cachePut(env: Env, key: string, value: string, ttlSec: number): Promise<void> {
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
 * Cache-first fetch with automatic key fallback.
 *
 * `makeUrl` receives the API key and must return the full endpoint URL.
 * Retries the next key on 429 / 401 / 5xx or JSON `Response: "Error"` (CC rate limit often uses HTTP 200).
 */
async function cachedFetchJson(
  env: Env,
  cacheKey: string,
  ttlSec: number,
  makeUrl: (key: string) => string,
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
  if (keys.length === 0) throw new Error('No CryptoCompare API key configured')

  let lastErr: Error | null = null
  for (const key of keys) {
    try {
      const res = await fetch(makeUrl(key))
      if (res.status === 429 || res.status === 401 || res.status >= 500) {
        lastErr = new Error(`CryptoCompare HTTP ${res.status}`)
        continue
      }
      if (!res.ok) throw new Error(`CryptoCompare HTTP ${res.status}`)
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
      lastErr = e instanceof Error ? e : new Error(String(e))
    }
  }
  throw lastErr ?? new Error('All CryptoCompare keys failed')
}

export type UsdSpot = { usd: number; changePct24h: number }

/** Batch spot vs USD + 24h % change for wallet pricing (fiat ISO codes work for many pairs on CC). */
export async function fetchUsdSpots(env: Env, symbols: string[]): Promise<Map<string, UsdSpot>> {
  const uniq = [...new Set(symbols.map((s) => s.toUpperCase().trim()).filter(Boolean))]
  if (uniq.length === 0) return new Map()
  if (apiKeys(env).length === 0) return new Map()

  const fsyms = uniq.join(',')
  const cacheKey = `cc:walletusd:${fsyms}`

  // 120 s TTL — well above KV's 60 s minimum; fallback key used automatically on 429/5xx.
  try {
    const data = (await cachedFetchJson(
      env,
      cacheKey,
      120,
      (k) => `${CC_DATA}/pricemultifull?fsyms=${encodeURIComponent(fsyms)}&tsyms=USD&api_key=${encodeURIComponent(k)}`,
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
