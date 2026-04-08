import { Hono } from 'hono'
import type { Env } from '../types/env'
import type { AppVariables } from '../types/env'
import { fetchFinnhubQuote, fetchFinnhubCandles } from '../lib/finnhub-prices'
import { fetchUsdSpots } from '../lib/cc-prices'

const prices = new Hono<{ Bindings: Env; Variables: AppVariables }>()

/**
 * Unified market price endpoint.
 *
 * GET /prices?category=crypto&fsyms=BTC&tsyms=USDT
 * GET /prices?category=stock&symbol=AAPL
 * GET /prices?category=etf&symbol=SPY
 * GET /prices?category=forex&from=EUR&to=USD
 * GET /prices?category=commodity&symbol=OANDA:XAU_USD
 *
 * Returns: { price, changePct24h, high24h, low24h, volume24h }
 */
prices.get('/', async (c) => {
  const category = (c.req.query('category') ?? 'crypto').toLowerCase()

  if (category === 'crypto') {
    const fsyms = (c.req.query('fsyms') ?? 'BTC').toUpperCase()
    const map = await fetchUsdSpots(c.env, [fsyms])
    const spot = map.get(fsyms)
    if (!spot) return c.json({ error: 'Price not available' }, 503)
    return c.json({
      price: spot.usd,
      changePct24h: spot.changePct24h,
      high24h: null,
      low24h: null,
      volume24h: null,
    })
  }

  if (category === 'forex') {
    const from = (c.req.query('from') ?? 'EUR').toUpperCase()
    const to = (c.req.query('to') ?? 'USD').toUpperCase()
    const symbol = `OANDA:${from}_${to}`
    const quote = await fetchFinnhubQuote(c.env, symbol)
    if (!quote) return c.json({ error: 'Price not available' }, 503)
    return c.json({
      price: quote.price,
      changePct24h: quote.changePct24h,
      high24h: quote.high,
      low24h: quote.low,
      volume24h: null,
    })
  }

  // stock, etf, commodity
  const symbol = c.req.query('symbol')
  if (!symbol) return c.json({ error: 'symbol query param required' }, 400)
  const finnSymbol = symbol.includes(':') ? symbol : symbol.toUpperCase()
  const quote = await fetchFinnhubQuote(c.env, finnSymbol)
  if (!quote) return c.json({ error: 'Price not available' }, 503)
  return c.json({
    price: quote.price,
    changePct24h: quote.changePct24h,
    high24h: quote.high,
    low24h: quote.low,
    volume24h: null,
  })
})

// Candle resolution + span config per UI filter
const CANDLE_CONFIG: Record<string, { resolution: string; spanSec: number }> = {
  '1H': { resolution: '5',  spanSec: 4  * 3600 },      // 5-min bars, last 4 h
  '1D': { resolution: '60', spanSec: 24 * 3600 },       // 1-h bars,   last 24 h
  '1W': { resolution: '60', spanSec: 7  * 24 * 3600 },  // 1-h bars,   last 7 d
  '1M': { resolution: 'D',  spanSec: 30 * 24 * 3600 },  // daily bars, last 30 d
  '1Y': { resolution: 'W',  spanSec: 365 * 24 * 3600 }, // weekly bars,last 1 y
}

type CoinDataRow = {
  time: number; open: number; close: number; price: number
  high: number; low: number; volumefrom: number; volumeto: number; change24hrs: number
}

function candlesToCoinData(candles: { time: number; open: number; high: number; low: number; close: number; volume: number }[]): CoinDataRow[] {
  return candles.map(c => ({
    time: c.time,
    open: c.open,
    close: c.close,
    price: c.close,
    high: c.high,
    low: c.low,
    volumefrom: c.volume,
    volumeto: c.volume * c.close,
    change24hrs: c.close - c.open,
  }))
}

/**
 * GET /prices/history?category=stock&symbol=AAPL
 * GET /prices/history?category=etf&symbol=SPY
 * GET /prices/history?category=forex&from=EUR&to=USD
 * GET /prices/history?category=commodity&symbol=OANDA:XAU_USD
 *
 * Returns the same { info, hChanges, dChanges, wChanges, mChanges, yChanges }
 * shape as /crypto/coin-detail so the frontend chart needs no adapter.
 */
prices.get('/history', async (c) => {
  const category = (c.req.query('category') ?? 'stock').toLowerCase()
  const now = Math.floor(Date.now() / 1000)

  let finnSymbol: string

  if (category === 'forex' || category === 'commodity') {
    const from = (c.req.query('from') ?? 'EUR').toUpperCase()
    const to   = (c.req.query('to')   ?? 'USD').toUpperCase()
    // commodity: symbol already includes OANDA: prefix
    const raw = c.req.query('symbol')
    finnSymbol = raw?.includes(':') ? raw : `OANDA:${from}_${to}`
  } else {
    const sym = c.req.query('symbol')
    if (!sym) return c.json({ error: 'symbol required' }, 400)
    finnSymbol = sym.toUpperCase()
  }

  // Fetch all 5 timeframes in parallel
  const entries = Object.entries(CANDLE_CONFIG)
  const results = await Promise.all(
    entries.map(([, { resolution, spanSec }]) =>
      fetchFinnhubCandles(c.env, finnSymbol, resolution, now - spanSec, now)
    )
  )

  const [hRaw, dRaw, wRaw, mRaw, yRaw] = results
  const toRows = (r: typeof hRaw) => r && r.length > 0 ? candlesToCoinData(r) : []

  // Build a minimal info block from the first available candle
  const allCandles = [...(hRaw ?? []), ...(dRaw ?? [])]
  const latestClose = allCandles.length > 0 ? allCandles[allCandles.length - 1].close : 0

  return c.json({
    info: {
      coinId: finnSymbol,
      coinName: finnSymbol,
      coinShort: finnSymbol,
      coinChain: category,
      confirmLevel: 0,
      price: String(latestClose),
      change24hrs: '0',
      volume24hrs: '0',
      supply: '0',
      marketCapital: '0',
      circulatingSupply: '0',
      openDay: '0',
      highDay: '0',
      lowDay: '0',
    },
    hChanges: toRows(hRaw),
    dChanges: toRows(dRaw),
    wChanges: toRows(wRaw),
    mChanges: toRows(mRaw),
    yChanges: toRows(yRaw),
  })
})

export { prices as pricesRoutes }
