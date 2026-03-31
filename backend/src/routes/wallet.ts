import { Hono } from 'hono'
import { eq, desc } from 'drizzle-orm'
import type { Env } from '../types/env'
import type { AppVariables } from '../types/env'
import { requireUser } from '../middleware/session'
import { catalogDepositAddress } from '../lib/catalog-deposit-address'
import { coincapIconUrl } from '../lib/coincap'
import * as schema from '../db/schema'

const wallet = new Hono<{ Bindings: Env; Variables: AppVariables }>()

function sortWalletAssets<
  T extends { assetType: 'crypto' | 'fiat'; coinShort: string; coinName: string },
>(rows: T[]): T[] {
  return [...rows].sort((a, b) => {
    if (a.assetType === 'fiat' && b.assetType !== 'fiat') return -1
    if (a.assetType !== 'fiat' && b.assetType === 'fiat') return 1
    const bySym = a.coinShort.localeCompare(b.coinShort)
    if (bySym !== 0) return bySym
    return a.coinName.localeCompare(b.coinName)
  })
}

wallet.get('/assets', requireUser, async (c) => {
  const joined = await c.var.db
    .select({
      a: schema.walletAssets,
      catalogDeposit: schema.coins.depositAddress,
      catalogSymbol: schema.coins.symbol,
    })
    .from(schema.walletAssets)
    .leftJoin(schema.coins, eq(schema.walletAssets.coinId, schema.coins.id))
    .where(eq(schema.walletAssets.userId, c.var.user!.id))

  const data = sortWalletAssets(
    joined.map(({ a, catalogDeposit, catalogSymbol }) => {
      const isCrypto = a.assetType === 'crypto'
      const sym = (catalogSymbol ?? a.coinShort).trim()
      const walletAddress = isCrypto
        ? catalogDeposit && catalogDeposit.trim()
          ? catalogDeposit.trim()
          : catalogDepositAddress(sym)
        : a.walletAddress
      return {
        walletAddress,
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
        iconUrl: isCrypto ? coincapIconUrl(sym) : (a.iconUrl ?? undefined),
        iconClass: isCrypto ? undefined : (a.iconClass ?? undefined),
        description: a.description ?? undefined,
      }
    })
  )

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
