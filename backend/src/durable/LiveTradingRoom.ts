import { createDbContext, releaseDbContext } from '../db/client'
import * as schema from '../db/schema'
import type { Env } from '../types/env'
import { fetchUsdSpots } from '../lib/cc-prices'
import { fetchFinnhubQuote, pairToFinnhubSymbol } from '../lib/finnhub-prices'
import { evaluateLiveTpslForPair } from '../lib/live-tpsl-eval'
import { creditUserFiatUsd, spendUserFiatUsd } from '../lib/wallet-ledger'

type BookEntry = { price: number; quantity: number }

// --- asset-category detection ---

const KNOWN_CRYPTO = new Set([
  'BTC', 'ETH', 'SOL', 'BNB', 'XRP', 'ADA', 'DOGE', 'DOT', 'MATIC', 'LINK',
  'AVAX', 'UNI', 'LTC', 'BCH', 'ATOM', 'NEAR', 'FTM', 'ALGO', 'VET', 'ICP',
  'SAND', 'MANA', 'AXS', 'TRX', 'SHIB', 'PEPE', 'TON', 'APT', 'ARB', 'OP',
])

const KNOWN_FIAT = new Set([
  'USD', 'EUR', 'GBP', 'JPY', 'AUD', 'CHF', 'CAD', 'NZD', 'SEK', 'NOK', 'DKK',
  'USDT', 'USDC',
])

const KNOWN_COMMODITY = new Set([
  'XAU', 'XAG', 'WTI', 'BRENT', 'NG', 'COPPER', 'PLATINUM', 'PALLADIUM',
])

type PriceCategory = 'crypto' | 'forex' | 'commodity' | 'stock'

function detectCategory(pair: string): PriceCategory {
  const parts = pair.split(/[-/]/)
  const base = (parts[0] ?? '').toUpperCase().trim()
  const quote = (parts[1] ?? '').toUpperCase().trim()
  if (KNOWN_CRYPTO.has(base)) return 'crypto'
  if (KNOWN_COMMODITY.has(base)) return 'commodity'
  if (KNOWN_FIAT.has(base) && KNOWN_FIAT.has(quote)) return 'forex'
  return 'stock'
}

/** Fetch live mid price + changePct for any pair. */
async function fetchPriceForPair(
  env: Env,
  pair: string
): Promise<{ price: number; changePct24h: number } | null> {
  const parts = pair.split(/[-/]/)
  const base = (parts[0] ?? '').toUpperCase().trim()
  const quote = (parts[1] ?? 'USD').toUpperCase().trim()
  const category = detectCategory(pair)

  if (category === 'crypto') {
    const spotMap = await fetchUsdSpots(env, [base])
    const spot = spotMap.get(base)
    if (!spot || !spot.usd) return null
    return { price: spot.usd, changePct24h: spot.changePct24h }
  }

  const finnhubSym = pairToFinnhubSymbol(base, quote === 'USDT' ? 'USD' : quote, category)
  const quote_ = await fetchFinnhubQuote(env, finnhubSym)
  if (!quote_ || !quote_.price) return null
  return { price: quote_.price, changePct24h: quote_.changePct24h }
}

// --- order book seed ---

function seedBookAround(mid: number): { asks: BookEntry[]; bids: BookEntry[] } {
  const tick = Math.max(mid * 0.0001, 0.01)
  const asks: BookEntry[] = []
  const bids: BookEntry[] = []
  for (let i = 0; i < 50; i++) {
    asks.push({ price: mid + (i + 1) * tick, quantity: +(0.3 + i * 0.08).toFixed(4) })
    bids.push({ price: mid - (i + 1) * tick, quantity: +(0.4 + i * 0.09).toFixed(4) })
  }
  return { asks, bids }
}

function seedBook(): { asks: BookEntry[]; bids: BookEntry[] } {
  return seedBookAround(43150.75)
}

export class LiveTradingRoom {
  private asks: BookEntry[] = []
  private bids: BookEntry[] = []
  private readonly sockets = new Set<WebSocket>()

  constructor(
    private ctx: DurableObjectState,
    private env: Env
  ) {}

  private ensureBook() {
    if (this.asks.length === 0 && this.bids.length === 0) {
      const s = seedBook()
      this.asks = s.asks
      this.bids = s.bids
    }
  }

  private broadcast(obj: unknown) {
    const msg = JSON.stringify(obj)
    for (const ws of this.sockets) {
      try {
        ws.send(msg)
      } catch {
        /* ignore */
      }
    }
  }

  private scheduleTpslAlarm() {
    void this.ctx.storage.getAlarm().then((t) => {
      if (t == null) void this.ctx.storage.setAlarm(Date.now() + 1500)
    })
  }

  async alarm() {
    const stored = await this.ctx.storage.get<string>('pair')
    const pairName =
      (stored && stored.trim()) ||
      (typeof this.ctx.id.name === 'string' ? this.ctx.id.name : '')
    try {
      this.ensureBook()
      const bookMid =
        this.asks.length > 0 && this.bids.length > 0
          ? (this.asks[0].price + this.bids[0].price) / 2
          : null

      const priceData = pairName.length > 0 ? await fetchPriceForPair(this.env, pairName) : null
      const mid = priceData?.price ?? bookMid
      const changePct24h = priceData?.changePct24h ?? 0

      if (pairName && mid != null && mid > 0) {
        const ctxDb = await createDbContext(this.env.HYPERDRIVE.connectionString)
        try {
          const n = await evaluateLiveTpslForPair(this.env, ctxDb.db, pairName.toUpperCase(), mid)
          if (n > 0) {
            this.broadcast({ type: 'trade_closed', pair: pairName.toUpperCase(), count: n })
          }
        } finally {
          await releaseDbContext(ctxDb)
        }
        this.broadcast({
          type: 'book_update',
          asks: this.asks,
          bids: this.bids,
          price: mid,
          changePct24h,
          spotSource: priceData != null ? 'external' : 'book',
        })
      }
    } finally {
      await this.ctx.storage.setAlarm(Date.now() + 10_000)
    }
  }

  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url)

    if (request.headers.get('Upgrade') === 'websocket') {
      this.ensureBook()
      try {
        const path = new URL(request.url).pathname
        const m = path.match(/\/live\/ws\/(.+)$/i)
        if (m?.[1]) {
          await this.ctx.storage.put('pair', decodeURIComponent(m[1]).trim().toUpperCase())
        }
      } catch {
        /* ignore */
      }
      const pair = new WebSocketPair()
      const [client, server] = Object.values(pair)
      this.ctx.acceptWebSocket(server)
      this.sockets.add(server)
      server.send(
        JSON.stringify({
          type: 'snapshot',
          asks: this.asks,
          bids: this.bids,
          price: this.asks[0] && this.bids[0] ? (this.asks[0].price + this.bids[0].price) / 2 : null,
        })
      )
      this.scheduleTpslAlarm()
      return new Response(null, { status: 101, webSocket: client })
    }

    if (request.method === 'POST' && url.pathname.endsWith('/internal/order')) {
      this.ensureBook()
      const body = (await request.json()) as {
        pair: string
        side: 'buy' | 'sell'
        type: 'market' | 'limit' | 'stop'
        amount: number
        leverage: number
        price?: number
        marginType: 'isolated' | 'cross'
        userId: number
        userPublicId: string
        takeProfitPrice?: number
        stopLossPrice?: number
      }

      this.scheduleTpslAlarm()
      await this.ctx.storage.put('pair', body.pair.toUpperCase())

      const now = Math.floor(Date.now() / 1000)
      const orderId = crypto.randomUUID()
      /** UI sends `price` for market orders (live quote). Prefer it over the synthetic book so entry matches the chart. */
      const refPrice =
        body.price != null && Number(body.price) > 0 ? Number(body.price) : 0
      let execPrice = 0
      if (body.type === 'market') {
        if (refPrice > 0) {
          execPrice = refPrice
        } else {
          execPrice =
            body.side === 'buy'
              ? this.asks[0]?.price ?? 0
              : this.bids[0]?.price ?? 0
        }
      } else {
        execPrice = body.price ?? this.asks[0]?.price ?? 0
      }

      const lev = Math.max(1, body.leverage || 1)
      const notionalUsd = body.amount * execPrice
      const marginUsd = lev > 0 ? notionalUsd / lev : notionalUsd

      const ctxDb = await createDbContext(this.env.HYPERDRIVE.connectionString)
      try {
        const { db } = ctxDb

        if (marginUsd > 0 && execPrice > 0) {
          const spend = await spendUserFiatUsd(
            this.env,
            db,
            body.userId,
            marginUsd,
            `Live order margin (~${marginUsd.toFixed(2)} USD) for ${body.pair} ${body.side}.`,
            'Trade margin'
          )
          if (!spend.ok) {
            return Response.json({ ok: false, error: spend.error }, { status: 400 })
          }
        }

        try {
          if (body.type === 'market' && refPrice > 0) {
            const book = seedBookAround(refPrice)
            this.asks = book.asks
            this.bids = book.bids
          }

          await db.insert(schema.liveOrders).values({
            id: orderId,
            userId: body.userId,
            pair: body.pair,
            side: body.side,
            orderType: body.type,
            amount: String(body.amount),
            leverage: body.leverage,
            price: String(execPrice ?? 0),
            marginType: body.marginType,
            status: 'filled',
            createdAt: now,
          })

          const parts = body.pair.split('-').map((p) => p.trim().toUpperCase())
          const base = parts[0] || 'BTC'
          const quote = parts[1] || 'USDT'
          const invested = Number(notionalUsd.toFixed(8))
          const marginStr = Number(marginUsd.toFixed(8))
          const DEFAULT_TP = 0.02
          const DEFAULT_SL = 0.01
          let tpPx =
            body.takeProfitPrice != null && body.takeProfitPrice > 0 ? body.takeProfitPrice : 0
          let slPx =
            body.stopLossPrice != null && body.stopLossPrice > 0 ? body.stopLossPrice : 0
          if (execPrice > 0) {
            if (body.side === 'buy') {
              if (!(tpPx > 0)) tpPx = execPrice * (1 + DEFAULT_TP)
              if (!(slPx > 0)) slPx = execPrice * (1 - DEFAULT_SL)
            } else {
              if (!(tpPx > 0)) tpPx = execPrice * (1 - DEFAULT_TP)
              if (!(slPx > 0)) slPx = execPrice * (1 + DEFAULT_SL)
            }
          }

          await db.insert(schema.trades).values({
            id: orderId,
            userId: body.userId,
            pair: body.pair.toUpperCase(),
            base,
            quote,
            option: body.side,
            direction: body.side === 'buy' ? 'long' : 'short',
            entryTime: now,
            entryPrice: String(execPrice),
            invested: String(invested),
            currency: 'USD',
            status: 'open',
            roi: null,
            leverage: lev,
            size: String(body.amount),
            margin: String(marginStr),
            marginPercentage: '100',
            marginType: body.marginType,
            pnl: '0',
            sl: String(slPx),
            tp: String(tpPx),
            fees: '0',
            liquidationPrice: '0',
            marketPrice: String(execPrice),
            strategy: 'live-desk',
            confidence: 50,
            riskReward: '1:1',
            note: `Live ${body.side} ${body.pair} @ ${execPrice}`,
            setup: 'live-order',
            fundedWith: 'fiat',
            executionVenue: 'live',
            tags: [orderId],
          })
        } catch {
          if (marginUsd > 0 && execPrice > 0) {
            await creditUserFiatUsd(
              this.env,
              db,
              body.userId,
              marginUsd,
              'Refund: live order recording failed.',
              'Trade margin'
            )
          }
          return Response.json({ ok: false, error: 'Could not record order' }, { status: 500 })
        }
      } finally {
        await releaseDbContext(ctxDb)
      }

      if (body.side === 'buy' && this.asks.length) {
        this.asks[0].quantity = Math.max(0, this.asks[0].quantity - body.amount * 0.01)
      } else if (body.side === 'sell' && this.bids.length) {
        this.bids[0].quantity = Math.max(0, this.bids[0].quantity - body.amount * 0.01)
      }

      this.broadcast({
        type: 'order_filled',
        orderId,
        pair: body.pair,
        side: body.side,
        price: execPrice,
        asks: this.asks,
        bids: this.bids,
      })

      return Response.json({ ok: true, orderId, price: execPrice })
    }

    if (request.method === 'POST' && url.pathname.endsWith('/internal/cancel')) {
      const body = (await request.json()) as { orderId: string }
      this.broadcast({ type: 'order_cancelled', orderId: body.orderId })
      return Response.json({ ok: true })
    }

    return new Response('Not found', { status: 404 })
  }

  webSocketMessage(ws: WebSocket, message: string | ArrayBuffer) {
    const text = typeof message === 'string' ? message : new TextDecoder().decode(message)
    try {
      const o = JSON.parse(text) as { type?: string }
      if (o.type === 'ping') {
        ws.send(JSON.stringify({ type: 'pong', t: Date.now() }))
      }
    } catch {
      /* ignore */
    }
  }

  webSocketClose(ws: WebSocket) {
    this.sockets.delete(ws)
  }
}
