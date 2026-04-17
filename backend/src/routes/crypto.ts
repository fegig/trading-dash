import { Hono } from 'hono'
import { eq } from 'drizzle-orm'
import type { Env } from '../types/env'
import type { AppVariables } from '../types/env'
import * as schema from '../db/schema'
import {
  CC_DATA,
  cacheGet,
  cachePut,
  cachedFetchCryptoCompareJson,
} from '../lib/cc-prices'

function ccErrorStatus(msg: string): 502 | 503 {
  return msg.includes('budget exceeded') ? 503 : 502
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
  const fsyms = c.req.query('fsyms') ?? 'BTC'
  const tsyms = c.req.query('tsyms') ?? 'USD'
  const cacheKey = `cc:walletusd:${fsyms.toUpperCase()}`
  try {
    const data = await cachedFetchCryptoCompareJson(c.env, cacheKey, 120, (k) => {
      const q = `fsyms=${encodeURIComponent(fsyms)}&tsyms=${encodeURIComponent(tsyms)}`
      return k
        ? `${CC_DATA}/pricemultifull?${q}&api_key=${encodeURIComponent(k)}`
        : `${CC_DATA}/pricemultifull?${q}`
    })
    return c.json(data)
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'upstream error'
    return c.json({ error: msg }, ccErrorStatus(msg))
  }
})

crypto.get('/history', async (c) => {
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
    const data = (await cachedFetchCryptoCompareJson(c.env, cacheKey, 600, (k) => {
      const q = `fsym=${encodeURIComponent(base)}&tsym=${encodeURIComponent(quote)}&limit=${limit}`
      return k ? `${CC_DATA}${path}?${q}&api_key=${encodeURIComponent(k)}` : `${CC_DATA}${path}?${q}`
    })) as {
      Data?: { Data?: HistRow[] }
    }
    const rows = data.Data?.Data ?? []
    return c.json({ Data: { Data: mapHist(rows) } })
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'upstream error'
    return c.json({ error: msg }, ccErrorStatus(msg))
  }
})

crypto.get('/news', async (c) => {
  const lang = c.req.query('lang') ?? 'EN'
  const cacheKey = `cc:news:${lang}`
  try {
    const data = await cachedFetchCryptoCompareJson(c.env, cacheKey, 900, (k) =>
      k
        ? `${CC_DATA}/v2/news/?lang=${encodeURIComponent(lang)}&api_key=${encodeURIComponent(k)}`
        : `${CC_DATA}/v2/news/?lang=${encodeURIComponent(lang)}`,
    )
    return c.json(data)
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'upstream error'
    return c.json({ error: msg }, ccErrorStatus(msg))
  }
})

crypto.get('/coin-detail', async (c) => {
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
      /* cache corrupt — rebuild */
    }
  }

  const makeHistUrl = (path: string, limit: number) => (k: string | null) => {
    const q = `fsym=${encodeURIComponent(base)}&tsym=${encodeURIComponent(quote)}&limit=${limit}`
    return k ? `${CC_DATA}${path}?${q}&api_key=${encodeURIComponent(k)}` : `${CC_DATA}${path}?${q}`
  }

  try {
    const [priceData, hmData, hhData, hwData, hmthData, hyData] = await Promise.all([
      cachedFetchCryptoCompareJson(c.env, `cc:walletusd:${base}`, 120, (k) => {
        const q = `fsyms=${encodeURIComponent(base)}&tsyms=${encodeURIComponent(quote)}`
        return k
          ? `${CC_DATA}/pricemultifull?${q}&api_key=${encodeURIComponent(k)}`
          : `${CC_DATA}/pricemultifull?${q}`
      }),
      cachedFetchCryptoCompareJson(
        c.env,
        `cc:hist:${base}:${quote}:/v2/histominute:60`,
        120,
        makeHistUrl('/v2/histominute', 60),
      ),
      cachedFetchCryptoCompareJson(
        c.env,
        `cc:hist:${base}:${quote}:/v2/histohour:24`,
        600,
        makeHistUrl('/v2/histohour', 24),
      ),
      cachedFetchCryptoCompareJson(
        c.env,
        `cc:hist:${base}:${quote}:/v2/histohour:168`,
        600,
        makeHistUrl('/v2/histohour', 168),
      ),
      cachedFetchCryptoCompareJson(
        c.env,
        `cc:hist:${base}:${quote}:/v2/histoday:30`,
        600,
        makeHistUrl('/v2/histoday', 30),
      ),
      cachedFetchCryptoCompareJson(
        c.env,
        `cc:hist:${base}:${quote}:/v2/histoday:365`,
        600,
        makeHistUrl('/v2/histoday', 365),
      ),
    ])

    const priceJson = priceData as { RAW?: Record<string, Record<string, PriceRaw>> }
    const coinInfo = priceJson.RAW?.[base]?.[quote]
    if (!coinInfo) {
      return c.json({ error: 'Price data not found' }, 404)
    }

    const toRows = (d: unknown) =>
      mapHist(((d as { Data?: { Data?: HistRow[] } }).Data?.Data) ?? [])

    const [hChanges, dChanges, wChanges, mChanges, yChanges] = [
      toRows(hmData),
      toRows(hhData),
      toRows(hwData),
      toRows(hmthData),
      toRows(hyData),
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

    await cachePut(c.env, cacheKey, JSON.stringify(payload), 600)
    return c.json(payload)
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'upstream error'
    return c.json({ error: msg }, ccErrorStatus(msg))
  }
})

export { crypto as cryptoRoutes }
