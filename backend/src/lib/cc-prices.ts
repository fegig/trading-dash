import type { Env } from '../types/env'

const CC_DATA = 'https://min-api.cryptocompare.com/data'

function apiKey(env: Env): string {
  const k = env.CRYPTOCOMPARE_API_KEY
  return typeof k === 'string' ? k.trim() : ''
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

async function cachedFetchJson(
  env: Env,
  cacheKey: string,
  ttlSec: number,
  url: string
): Promise<unknown> {
  const hit = await cacheGet(env, cacheKey)
  if (hit) {
    try {
      return JSON.parse(hit) as unknown
    } catch {
      /* refetch */
    }
  }
  const res = await fetch(url)
  if (!res.ok) throw new Error(`CryptoCompare HTTP ${res.status}`)
  const data: unknown = await res.json()
  await cachePut(env, cacheKey, JSON.stringify(data), ttlSec)
  return data
}

export type UsdSpot = { usd: number; changePct24h: number }

/** Batch spot vs USD + 24h % change for wallet pricing (fiat ISO codes work for many pairs on CC). */
export async function fetchUsdSpots(env: Env, symbols: string[]): Promise<Map<string, UsdSpot>> {
  const key = apiKey(env)
  const uniq = [...new Set(symbols.map((s) => s.toUpperCase().trim()).filter(Boolean))]
  if (uniq.length === 0) return new Map()
  if (!key) return new Map()

  const fsyms = uniq.join(',')
  const cacheKey = `cc:walletusd:${fsyms}`
  const url = `${CC_DATA}/pricemultifull?fsyms=${encodeURIComponent(fsyms)}&tsyms=USD&api_key=${encodeURIComponent(key)}`

  try {
    const data = (await cachedFetchJson(env, cacheKey, 45, url)) as {
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
