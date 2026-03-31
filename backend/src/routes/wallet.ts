import { Hono } from 'hono'
import { eq, desc } from 'drizzle-orm'
import type { Env } from '../types/env'
import type { AppVariables } from '../types/env'
import { requireUser } from '../middleware/session'
import * as schema from '../db/schema'

const wallet = new Hono<{ Bindings: Env; Variables: AppVariables }>()

wallet.get('/assets', requireUser, async (c) => {
  const rows = await c.var.db
    .select()
    .from(schema.walletAssets)
    .where(eq(schema.walletAssets.userId, c.var.user!.id))

  const data = rows.map((a) => ({
    walletAddress: a.walletAddress,
    userBalance: Number(a.userBalance),
    coinName: a.coinName,
    coinShort: a.coinShort,
    coinChain: a.coinChain,
    coinId: a.coinId,
    walletId: a.walletId,
    price: a.price,
    change24hrs: a.change24hrs,
    coinColor: a.coinColor,
    assetType: a.assetType,
    fundingEligible: a.fundingEligible,
    iconUrl: a.iconUrl ?? undefined,
    iconClass: a.iconClass ?? undefined,
    description: a.description ?? undefined,
  }))
  return c.json(data)
})

wallet.get('/transactions', requireUser, async (c) => {
  const rows = await c.var.db
    .select()
    .from(schema.walletTransactions)
    .where(eq(schema.walletTransactions.userId, c.var.user!.id))
    .orderBy(desc(schema.walletTransactions.createdAt))
    .limit(200)

  const data = rows.map((t) => ({
    id: t.id,
    type: t.type,
    amount: Number(t.amount),
    eqAmount: Number(t.eqAmount),
    status: t.status,
    createdAt: t.createdAt,
    method: {
      type: t.methodType,
      name: t.methodName,
      symbol: t.methodSymbol,
      icon: t.methodIcon ?? undefined,
      iconClass: t.methodIconClass ?? undefined,
    },
    note: t.note ?? undefined,
  }))
  return c.json(data)
})

export { wallet as walletRoutes }
