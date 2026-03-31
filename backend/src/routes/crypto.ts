import { Hono } from 'hono'
import { eq } from 'drizzle-orm'
import type { Env } from '../types/env'
import type { AppVariables } from '../types/env'
import * as schema from '../db/schema'

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
  if (!res.ok) {
    throw new Error(`CryptoCompare HTTP ${res.status}`)
  }
  const data: unknown = await res.json()
  await cachePut(env, cacheKey, JSON.stringify(data), ttlSec)
  return data
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
  const key = apiKey(c.env)
  if (!key) return c.json({ error: 'CryptoCompare API key not configured' }, 503)
  const fsyms = c.req.query('fsyms') ?? 'BTC'
  const tsyms = c.req.query('tsyms') ?? 'USD'
  const cacheKey = `cc:price:${fsyms}:${tsyms}`
  const url = `${CC_DATA}/pricemultifull?fsyms=${encodeURIComponent(fsyms)}&tsyms=${encodeURIComponent(tsyms)}&api_key=${encodeURIComponent(key)}`
  try {
    const data = await cachedFetchJson(c.env, cacheKey, 30, url)
    return c.json(data)
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'upstream error'
    return c.json({ error: msg }, 502)
  }
})

crypto.get('/history', async (c) => {
  const key = apiKey(c.env)
  if (!key) return c.json({ error: 'CryptoCompare API key not configured' }, 503)
  const base = c.req.query('base') ?? 'BTC'
  const quote = c.req.query('quote') ?? 'USD'
  const interval = c.req.query('interval') ?? 'histominute'
  const limit = Math.min(2000, Math.max(1, Number(c.req.query('limit') ?? '60') || 60))
  const path =
    interval === 'histohour' || interval === 'histoday'
      ? `/v2/${interval}`
      : '/v2/histominute'
  const cacheKey = `cc:hist:${base}:${quote}:${path}:${limit}`
  const url = `${CC_DATA}${path}?fsym=${encodeURIComponent(base)}&tsym=${encodeURIComponent(quote)}&limit=${limit}&api_key=${encodeURIComponent(key)}`
  try {
    const data = (await cachedFetchJson(c.env, cacheKey, 300, url)) as {
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
  const key = apiKey(c.env)
  if (!key) return c.json({ error: 'CryptoCompare API key not configured' }, 503)
  const lang = c.req.query('lang') ?? 'EN'
  const cacheKey = `cc:news:${lang}`
  const url = `${CC_DATA}/v2/news/?lang=${encodeURIComponent(lang)}&api_key=${encodeURIComponent(key)}`
  try {
    const data = await cachedFetchJson(c.env, cacheKey, 600, url)
    return c.json(data)
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'upstream error'
    return c.json({ error: msg }, 502)
  }
})

crypto.get('/coin-detail', async (c) => {
  const key = apiKey(c.env)
  if (!key) return c.json({ error: 'CryptoCompare API key not configured' }, 503)
  const base = (c.req.query('base') ?? 'BTC').toUpperCase()
  const quote = (c.req.query('quote') ?? 'USDT').toUpperCase()

  const [coinRow] = await c.var.db
    .select()
    .from(schema.coins)
    .where(eq(schema.coins.id, base))
    .limit(1)

  const cacheKey = `cc:coindetail:${base}:${quote}`
  const hit = await cacheGet(c.env, cacheKey)
  if (hit) {
    try {
      return c.json(JSON.parse(hit) as unknown)
    } catch {
      /* rebuild */
    }
  }

  const priceUrl = `${CC_DATA}/pricemultifull?fsyms=${encodeURIComponent(base)}&tsyms=${encodeURIComponent(quote)}&api_key=${encodeURIComponent(key)}`
  const histMinuteUrl = `${CC_DATA}/v2/histominute?fsym=${encodeURIComponent(base)}&tsym=${encodeURIComponent(quote)}&limit=60&api_key=${encodeURIComponent(key)}`
  const histHourUrl = `${CC_DATA}/v2/histohour?fsym=${encodeURIComponent(base)}&tsym=${encodeURIComponent(quote)}&limit=24&api_key=${encodeURIComponent(key)}`
  const histWeekUrl = `${CC_DATA}/v2/histohour?fsym=${encodeURIComponent(base)}&tsym=${encodeURIComponent(quote)}&limit=168&api_key=${encodeURIComponent(key)}`
  const histMonthUrl = `${CC_DATA}/v2/histoday?fsym=${encodeURIComponent(base)}&tsym=${encodeURIComponent(quote)}&limit=30&api_key=${encodeURIComponent(key)}`
  const histYearUrl = `${CC_DATA}/v2/histoday?fsym=${encodeURIComponent(base)}&tsym=${encodeURIComponent(quote)}&limit=365&api_key=${encodeURIComponent(key)}`

  try {
    const [priceRes, hm, hh, hw, hmth, hy] = await Promise.all([
      fetch(priceUrl),
      fetch(histMinuteUrl),
      fetch(histHourUrl),
      fetch(histWeekUrl),
      fetch(histMonthUrl),
      fetch(histYearUrl),
    ])
    if (!priceRes.ok) throw new Error(`price ${priceRes.status}`)
    const priceJson = (await priceRes.json()) as { RAW?: Record<string, Record<string, PriceRaw>> }
    const coinInfo = priceJson.RAW?.[base]?.[quote]
    if (!coinInfo) {
      return c.json({ error: 'Price data not found' }, 404)
    }

    const parseHist = async (r: Response) => {
      const j = (await r.json()) as { Data?: { Data?: HistRow[] } }
      return mapHist(j.Data?.Data ?? [])
    }

    const [hChanges, dChanges, wChanges, mChanges, yChanges] = await Promise.all([
      parseHist(hm),
      parseHist(hh),
      parseHist(hw),
      parseHist(hmth),
      parseHist(hy),
    ])

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

    await cachePut(c.env, cacheKey, JSON.stringify(payload), 60)
    return c.json(payload)
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'upstream error'
    return c.json({ error: msg }, 502)
  }
})

export { crypto as cryptoRoutes }
