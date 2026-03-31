import { createDbContext, releaseDbContext } from '../db/client'
import * as schema from '../db/schema'
import type { Env } from '../types/env'

type BookEntry = { price: number; quantity: number }

function seedBook(): { asks: BookEntry[]; bids: BookEntry[] } {
  const mid = 43150.75
  const asks: BookEntry[] = []
  const bids: BookEntry[] = []
  for (let i = 0; i < 10; i++) {
    asks.push({ price: mid + (i + 1) * 25, quantity: 0.3 + i * 0.1 })
    bids.push({ price: mid - (i + 1) * 25, quantity: 0.4 + i * 0.12 })
  }
  return { asks, bids }
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

  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url)

    if (request.headers.get('Upgrade') === 'websocket') {
      this.ensureBook()
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
      }

      const now = Math.floor(Date.now() / 1000)
      const orderId = crypto.randomUUID()
      const execPrice =
        body.type === 'market'
          ? body.side === 'buy'
            ? this.asks[0]?.price ?? body.price ?? 0
            : this.bids[0]?.price ?? body.price ?? 0
          : body.price ?? this.asks[0]?.price ?? 0

      const ctxDb = await createDbContext(this.env.HYPERDRIVE.connectionString)
      try {
        await ctxDb.db.insert(schema.liveOrders).values({
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

  webSocketMessage(_ws: WebSocket, _message: string | ArrayBuffer) {
    /* optional client commands */
  }

  webSocketClose(ws: WebSocket) {
    this.sockets.delete(ws)
  }
}
