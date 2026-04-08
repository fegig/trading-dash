import type { Env } from '../types/env'

const FINNHUB_BASE = 'https://finnhub.io/api/v1'

function apiKey(env: Env): string {
  const k = env.FINNHUB_API_KEY
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

export type FinnhubQuote = {
  price: number
  changePct24h: number
  high: number
  low: number
  open: number
  prevClose: number
}

type FinnhubQuoteRaw = {
  c: number  // current price
  d: number  // change
  dp: number // percent change
  h: number  // high of the day
  l: number  // low of the day
  o: number  // open
  pc: number // previous close
  t: number  // timestamp
}

/** Fetch a real-time quote from Finnhub for stocks, ETFs, forex (OANDA:EUR_USD) or commodities (OANDA:XAU_USD). */
export async function fetchFinnhubQuote(env: Env, symbol: string): Promise<FinnhubQuote | null> {
  const key = apiKey(env)
  if (!key) return null

  const cacheKey = `fh:quote:${symbol.toUpperCase()}`
  const cached = await cacheGet(env, cacheKey)
  if (cached) {
    try {
      return JSON.parse(cached) as FinnhubQuote
    } catch {
      /* refetch */
    }
  }

  const url = `${FINNHUB_BASE}/quote?symbol=${encodeURIComponent(symbol)}&token=${encodeURIComponent(key)}`
  try {
    const res = await fetch(url)
    if (!res.ok) return null
    const raw = (await res.json()) as FinnhubQuoteRaw
    if (!raw || !raw.c || raw.c <= 0) return null
    const quote: FinnhubQuote = {
      price: raw.c,
      changePct24h: typeof raw.dp === 'number' && Number.isFinite(raw.dp) ? raw.dp : 0,
      high: typeof raw.h === 'number' && raw.h > 0 ? raw.h : raw.c,
      low: typeof raw.l === 'number' && raw.l > 0 ? raw.l : raw.c,
      open: typeof raw.o === 'number' && raw.o > 0 ? raw.o : raw.c,
      prevClose: typeof raw.pc === 'number' && raw.pc > 0 ? raw.pc : raw.c,
    }
    await cachePut(env, cacheKey, JSON.stringify(quote), 60)
    return quote
  } catch {
    return null
  }
}

/** Build the Finnhub symbol for a trading pair based on detected category. */
export function pairToFinnhubSymbol(base: string, quote: string, category: 'forex' | 'commodity' | 'stock' | 'etf'): string {
  const b = base.toUpperCase()
  const q = quote.toUpperCase()
  if (category === 'forex' || category === 'commodity') {
    return `OANDA:${b}_${q}`
  }
  return b
}

export type FinnhubCandle = {
  time: number
  open: number
  high: number
  low: number
  close: number
  volume: number
}

type FinnhubCandleRaw = {
  s: string         // "ok" | "no_data"
  t?: number[]      // timestamps
  o?: number[]
  h?: number[]
  l?: number[]
  c?: number[]
  v?: number[]
}

/**
 * Fetch OHLCV candles from Finnhub.
 *
 * - Stocks/ETFs: endpoint = "stock"
 * - Forex + Commodities (OANDA:*): endpoint = "forex"
 *
 * Resolution: "1" | "5" | "15" | "30" | "60" | "D" | "W" | "M"
 */
export async function fetchFinnhubCandles(
  env: Env,
  symbol: string,
  resolution: string,
  from: number,
  to: number
): Promise<FinnhubCandle[] | null> {
  const key = apiKey(env)
  if (!key) return null

  const endpoint = symbol.includes(':') ? 'forex' : 'stock'
  const cacheKey = `fh:candle:${symbol}:${resolution}:${Math.floor(from / 300)}`
  const cached = await cacheGet(env, cacheKey)
  if (cached) {
    try {
      return JSON.parse(cached) as FinnhubCandle[]
    } catch {
      /* refetch */
    }
  }

  const url =
    `${FINNHUB_BASE}/${endpoint}/candle` +
    `?symbol=${encodeURIComponent(symbol)}` +
    `&resolution=${encodeURIComponent(resolution)}` +
    `&from=${Math.floor(from)}&to=${Math.floor(to)}` +
    `&token=${encodeURIComponent(key)}`

  try {
    const res = await fetch(url)
    if (!res.ok) return null
    const raw = (await res.json()) as FinnhubCandleRaw
    if (raw.s !== 'ok' || !raw.t || raw.t.length === 0) return []

    const candles: FinnhubCandle[] = raw.t.map((t, i) => ({
      time: t,
      open: raw.o?.[i] ?? 0,
      high: raw.h?.[i] ?? 0,
      low: raw.l?.[i] ?? 0,
      close: raw.c?.[i] ?? 0,
      volume: raw.v?.[i] ?? 0,
    }))

    // Cache longer for older timeframes; shorter for recent data
    const ttl = resolution === 'D' || resolution === 'W' ? 1800 : resolution === '60' ? 300 : 60
    await cachePut(env, cacheKey, JSON.stringify(candles), ttl)
    return candles
  } catch {
    return null
  }
}
