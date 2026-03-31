import { Hono } from 'hono'
import { eq, desc } from 'drizzle-orm'
import { walletConvertBodySchema } from '@trading-dash/shared'
import type { Env } from '../types/env'
import type { AppVariables } from '../types/env'
import { requireUser } from '../middleware/session'
import { catalogDepositAddress } from '../lib/catalog-deposit-address'
import { coincapIconUrl } from '../lib/coincap'
import { fetchUsdSpots } from '../lib/cc-prices'
import { executeWalletConvert } from '../lib/wallet-ledger'
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
  const userId = c.var.user!.id

  const [userRow] = await c.var.db
    .select({
      fiatCode: schema.fiatCurrencies.code,
      fiatName: schema.fiatCurrencies.name,
    })
    .from(schema.users)
    .leftJoin(schema.fiatCurrencies, eq(schema.users.currencyId, schema.fiatCurrencies.id))
    .where(eq(schema.users.id, userId))
    .limit(1)

  const joined = await c.var.db
    .select({
      a: schema.walletAssets,
      catalogDeposit: schema.coins.depositAddress,
      catalogSymbol: schema.coins.symbol,
    })
    .from(schema.walletAssets)
    .leftJoin(schema.coins, eq(schema.walletAssets.coinId, schema.coins.id))
    .where(eq(schema.walletAssets.userId, userId))

  const fiatAssetRow = joined.find((j) => j.a.assetType === 'fiat')
  const displayCodeRaw =
    (fiatAssetRow?.a.coinShort && fiatAssetRow.a.coinShort.trim()) ||
    (userRow?.fiatCode && userRow.fiatCode.trim()) ||
    'USD'
  const displayCode = displayCodeRaw.toUpperCase()
  const displayName =
    (userRow?.fiatName && userRow.fiatName.trim()) ||
    fiatAssetRow?.a.coinName ||
    'Funding wallet'

  const cryptoSyms = joined
    .filter((j) => j.a.assetType === 'crypto')
    .map((j) => (j.catalogSymbol ?? j.a.coinShort).trim().toUpperCase())
    .filter(Boolean)

  const priceSymbols = [...new Set([...cryptoSyms, displayCode])]
  const spots = await fetchUsdSpots(c.env, priceSymbols)

  const fiatSpot = spots.get(displayCode)
  const fiatUsd =
    displayCode === 'USD'
      ? 1
      : fiatSpot?.usd ??
        (() => {
          const n = Number(fiatAssetRow?.a.price)
          return Number.isFinite(n) && n > 0 ? n : 1
        })()

  const assets = sortWalletAssets(
    joined.map(({ a, catalogDeposit, catalogSymbol }) => {
      const isCrypto = a.assetType === 'crypto'
      const sym = (catalogSymbol ?? a.coinShort).trim().toUpperCase()
      const walletAddress = isCrypto
        ? catalogDeposit && catalogDeposit.trim()
          ? catalogDeposit.trim()
          : catalogDepositAddress(sym)
        : a.walletAddress

      let priceUsd: number
      let change24: string
      if (isCrypto) {
        const spot = spots.get(sym)
        const fallback = Number(a.price)
        priceUsd =
          spot?.usd ?? (Number.isFinite(fallback) && fallback > 0 ? fallback : 0)
        change24 =
          spot != null ? String(spot.changePct24h) : a.change24hrs
      } else {
        priceUsd = fiatUsd
        change24 =
          fiatSpot != null ? String(fiatSpot.changePct24h) : a.change24hrs
      }

      return {
        walletAddress,
        userBalance: Number(a.userBalance),
        coinName: a.coinName,
        coinShort: a.coinShort,
        coinChain: a.coinChain,
        coinId: a.coinId,
        walletId: a.walletId,
        price: String(priceUsd),
        change24hrs: change24,
        coinColor: a.coinColor,
        assetType: a.assetType,
        fundingEligible: a.fundingEligible,
        iconUrl: isCrypto ? coincapIconUrl(sym) : (a.iconUrl ?? undefined),
        iconClass: isCrypto ? undefined : (a.iconClass ?? undefined),
        description: a.description ?? undefined,
      }
    })
  )

  return c.json({
    displayCurrency: {
      code: displayCode,
      name: displayName,
      usdPerUnit: fiatUsd,
    },
    assets,
  })
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

wallet.post('/convert', requireUser, async (c) => {
  const parsed = walletConvertBodySchema.safeParse(await c.req.json().catch(() => ({})))
  if (!parsed.success) return c.json({ error: 'Invalid body' }, 400)

  const userId = c.var.user!.id
  const { fromWalletId, toWalletId, fromAmount } = parsed.data
  const result = await executeWalletConvert(c.env, c.var.db, userId, fromWalletId, toWalletId, fromAmount)
  if (!result.ok) return c.json({ error: result.error }, 400)
  return c.json(result)
})

export { wallet as walletRoutes }
