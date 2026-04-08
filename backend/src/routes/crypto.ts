import { Hono } from 'hono'
import { eq } from 'drizzle-orm'
import type { Env } from '../types/env'
import type { AppVariables } from '../types/env'
import * as schema from '../db/schema'

const CC_DATA = 'https://min-api.cryptocompare.com/data'

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

/** CryptoCompare often returns HTTP 200 with `Response: "Error"` (rate limit, etc.) — never cache that. */
function isCryptoCompareErrorBody(data: unknown): boolean {
  if (!data || typeof data !== 'object') return false
  const r = (data as { Response?: string; Message?: string }).Response
  return r === 'Error'
}

/** Cache-first fetch; auto-switches to the second CC key on 429 / 401 / 5xx / JSON rate-limit errors. */
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
      if (isCryptoCompareErrorBody(parsed)) {
        /* stale error in KV — ignore and refetch */
      } else {
        return parsed
      }
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

function fmtNum(n: number): string {
  if (!Number.isFinite(n)) return '0'
  return new Intl.NumberFormat('en-US', { maximumFractionDigits: 8 }).format(n)
}

type HistRow = {
  time: number
  open: number
  close: number
  high: number
  low: number
  volumefrom: number
  volumeto: number
}

function mapHist(rows: HistRow[]) {
  return rows.map((item) => ({
    time: item.time,
    open: item.open,
    close: item.close,
    price: item.close,
    high: item.high,
    low: item.low,
    volumefrom: item.volumefrom,
    volumeto: item.volumeto,
    change24hrs: item.close - item.open,
  }))
}

type PriceRaw = {
  PRICE: number
  CHANGEPCT24HOUR?: number
  VOLUME24HOUR?: number
  SUPPLY?: number
  MKTCAP?: number
  CIRCULATINGSUPPLY?: number
  OPENDAY?: number
  HIGHDAY?: number
  LOWDAY?: number
}

const crypto = new Hono<{ Bindings: Env; Variables: AppVariables }>()

crypto.get('/price', async (c) => {
  if (apiKeys(c.env).length === 0) return c.json({ error: 'CryptoCompare API key not configured' }, 503)
  const fsyms = c.req.query('fsyms') ?? 'BTC'
  const tsyms = c.req.query('tsyms') ?? 'USD'
  // Shared cache key with fetchUsdSpots so both paths reuse one KV entry.
  const cacheKey = `cc:walletusd:${fsyms.toUpperCase()}`
  try {
    const data = await cachedFetchJson(c.env, cacheKey, 120,
      (k) => `${CC_DATA}/pricemultifull?fsyms=${encodeURIComponent(fsyms)}&tsyms=${encodeURIComponent(tsyms)}&api_key=${encodeURIComponent(k)}`)
    return c.json(data)
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'upstream error'
    return c.json({ error: msg }, 502)
  }
})

crypto.get('/history', async (c) => {
  if (apiKeys(c.env).length === 0) return c.json({ error: 'CryptoCompare API key not configured' }, 503)
  const base = c.req.query('base') ?? 'BTC'
  const quote = c.req.query('quote') ?? 'USD'
  const interval = c.req.query('interval') ?? 'histominute'
  const limit = Math.min(2000, Math.max(1, Number(c.req.query('limit') ?? '60') || 60))
  const path =
    interval === 'histohour' || interval === 'histoday'
      ? `/v2/${interval}`
      : '/v2/histominute'
  const cacheKey = `cc:hist:${base}:${quote}:${path}:${limit}`
  try {
    const data = (await cachedFetchJson(c.env, cacheKey, 300,
      (k) => `${CC_DATA}${path}?fsym=${encodeURIComponent(base)}&tsym=${encodeURIComponent(quote)}&limit=${limit}&api_key=${encodeURIComponent(k)}`
    )) as {
      Data?: { Data?: HistRow[] }
    }
    const rows = data.Data?.Data ?? []
    return c.json({ Data: { Data: mapHist(rows) } })
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'upstream error'
    return c.json({ error: msg }, 502)
  }
})

crypto.get('/news', async (c) => {
  if (apiKeys(c.env).length === 0) return c.json({ error: 'CryptoCompare API key not configured' }, 503)
  const lang = c.req.query('lang') ?? 'EN'
  const cacheKey = `cc:news:${lang}`
  try {
    const data = await cachedFetchJson(c.env, cacheKey, 600,
      (k) => `${CC_DATA}/v2/news/?lang=${encodeURIComponent(lang)}&api_key=${encodeURIComponent(k)}`)
    return c.json(data)
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'upstream error'
    return c.json({ error: msg }, 502)
  }
})

crypto.get('/coin-detail', async (c) => {
  if (apiKeys(c.env).length === 0) return c.json({ error: 'CryptoCompare API key not configured' }, 503)
  const base = (c.req.query('base') ?? 'BTC').toUpperCase()
  const quote = (c.req.query('quote') ?? 'USDT').toUpperCase()

  const [coinRow] = await c.var.db
    .select()
    .from(schema.coins)
    .where(eq(schema.coins.id, base))
    .limit(1)

  // Whole payload cached for 300 s so the 6-request burst only fires on a cold miss.
  const cacheKey = `cc:coindetail:${base}:${quote}`
  const hit = await cacheGet(c.env, cacheKey)
  if (hit) {
    try {
      return c.json(JSON.parse(hit) as unknown)
    } catch {
      /* cache corrupt — rebuild */
    }
  }

  // Each sub-request goes through cachedFetchJson so the fallback key is used
  // automatically if the primary key is rate-limited on any one of them.
  const makeHistUrl = (path: string, limit: number) =>
    (k: string) => `${CC_DATA}${path}?fsym=${encodeURIComponent(base)}&tsym=${encodeURIComponent(quote)}&limit=${limit}&api_key=${encodeURIComponent(k)}`

  try {
    const [priceData, hmData, hhData, hwData, hmthData, hyData] = await Promise.all([
      cachedFetchJson(c.env, `cc:walletusd:${base}`, 120,
        (k) => `${CC_DATA}/pricemultifull?fsyms=${encodeURIComponent(base)}&tsyms=${encodeURIComponent(quote)}&api_key=${encodeURIComponent(k)}`),
      cachedFetchJson(c.env, `cc:hist:${base}:${quote}:/v2/histominute:60`, 120, makeHistUrl('/v2/histominute', 60)),
      cachedFetchJson(c.env, `cc:hist:${base}:${quote}:/v2/histohour:24`,   300, makeHistUrl('/v2/histohour',   24)),
      cachedFetchJson(c.env, `cc:hist:${base}:${quote}:/v2/histohour:168`,  300, makeHistUrl('/v2/histohour',  168)),
      cachedFetchJson(c.env, `cc:hist:${base}:${quote}:/v2/histoday:30`,    300, makeHistUrl('/v2/histoday',    30)),
      cachedFetchJson(c.env, `cc:hist:${base}:${quote}:/v2/histoday:365`,   300, makeHistUrl('/v2/histoday',   365)),
    ])

    const priceJson = priceData as { RAW?: Record<string, Record<string, PriceRaw>> }
    const coinInfo = priceJson.RAW?.[base]?.[quote]
    if (!coinInfo) {
      return c.json({ error: 'Price data not found' }, 404)
    }

    const toRows = (d: unknown) =>
      mapHist(((d as { Data?: { Data?: HistRow[] } }).Data?.Data) ?? [])

    const [hChanges, dChanges, wChanges, mChanges, yChanges] = [
      toRows(hmData), toRows(hhData), toRows(hwData), toRows(hmthData), toRows(hyData),
    ]

    const row = coinRow ?? {
      id: base,
      name: base,
      symbol: base,
      chain: 'Unknown',
      confirmLevel: 0,
      iconUrl: null,
      isActive: true,
    }

    const payload = {
      info: {
        coinId: row.id,
        coinName: row.name,
        coinShort: row.symbol,
        coinChain: row.chain,
        confirmLevel: row.confirmLevel,
        price: fmtNum(coinInfo.PRICE),
        change24hrs: fmtNum(coinInfo.CHANGEPCT24HOUR ?? 0),
        volume24hrs: fmtNum(coinInfo.VOLUME24HOUR ?? 0),
        supply: fmtNum(coinInfo.SUPPLY ?? 0),
        marketCapital: fmtNum(coinInfo.MKTCAP ?? 0),
        circulatingSupply: fmtNum(coinInfo.CIRCULATINGSUPPLY ?? 0),
        openDay: fmtNum(coinInfo.OPENDAY ?? 0),
        highDay: fmtNum(coinInfo.HIGHDAY ?? 0),
        lowDay: fmtNum(coinInfo.LOWDAY ?? 0),
      },
      hChanges,
      dChanges,
      wChanges,
      mChanges,
      yChanges,
    }

    await cachePut(c.env, cacheKey, JSON.stringify(payload), 300)
    return c.json(payload)
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'upstream error'
    return c.json({ error: msg }, 502)
  }
})

export { crypto as cryptoRoutes }
