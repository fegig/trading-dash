import { Hono } from 'hono'
import { and, eq, desc } from 'drizzle-orm'
import {
  walletConvertBodySchema,
  walletSendRequestBodySchema,
  walletDepositIntentBodySchema,
} from '@trading-dash/shared'
import type { Env } from '../types/env'
import type { AppVariables } from '../types/env'
import { requireUser } from '../middleware/session'
import { catalogDepositAddress } from '../lib/catalog-deposit-address'
import { coincapIconUrl } from '../lib/coincap'
import { fetchUsdSpots } from '../lib/cc-prices'
import { executeWalletConvert } from '../lib/wallet-ledger'
import { getPlatformSettingsRow } from '../lib/platform-settings'
import { sendEmail } from '../email/resend-client'
import { supportWalletRequestEmailHtml } from '../email/templates'
import { getTransactionalEmailBranding } from '../lib/email-branding'
import {
  WALLET_METHOD_WITHDRAWAL_REQUEST,
  WALLET_METHOD_DEPOSIT_REQUEST,
  DEPOSIT_INTENT_TTL_SEC,
} from '../lib/wallet-request-constants'
import { walletTransactionsBaseColumns } from '../lib/wallet-transactions-columns'
import * as schema from '../db/schema'

type Db = AppVariables['db']

async function resolveUserCryptoWallet(db: Db, userId: number, walletId: string) {
  const [row] = await db
    .select()
    .from(schema.walletAssets)
    .where(and(eq(schema.walletAssets.userId, userId), eq(schema.walletAssets.walletId, walletId)))
    .limit(1)
  if (!row || row.assetType !== 'crypto') return null
  return row
}

/** Lists transactions; retries without extended columns if migration 0012 is not applied yet. */
async function walletTransactionsForUser(db: Db, userId: number) {
  const where = eq(schema.walletTransactions.userId, userId)
  const order = desc(schema.walletTransactions.createdAt)
  try {
    return await db
      .select()
      .from(schema.walletTransactions)
      .where(where)
      .orderBy(order)
      .limit(200)
  } catch (err) {
    console.warn(
      '[wallet/transactions] full select failed (apply migration 0012_wallet_transactions_pending_meta if missing columns). Retrying without extended columns.',
      err
    )
    return await db
      .select(walletTransactionsBaseColumns)
      .from(schema.walletTransactions)
      .where(where)
      .orderBy(order)
      .limit(200)
  }
}

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
  const rows = await walletTransactionsForUser(c.var.db, c.var.user!.id)

  const data = rows.map((t) => {
    const ext = t as {
      counterpartyAddress?: string | null
      expiresAt?: number | null
    }
    return {
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
      counterpartyAddress: ext.counterpartyAddress?.trim() || undefined,
      expiresAt: ext.expiresAt ?? undefined,
    }
  })
  return c.json(data)
})

wallet.post('/send-request', requireUser, async (c) => {
  const parsed = walletSendRequestBodySchema.safeParse(await c.req.json().catch(() => ({})))
  if (!parsed.success) return c.json({ error: 'Invalid body' }, 400)

  const userId = c.var.user!.id
  const { walletId, amount, destinationAddress } = parsed.data
  const asset = await resolveUserCryptoWallet(c.var.db, userId, walletId)
  if (!asset) return c.json({ error: 'Crypto asset not found' }, 404)

  const bal = Number(asset.userBalance)
  if (!Number.isFinite(bal) || bal + 1e-12 < amount) {
    return c.json({ error: 'Insufficient balance' }, 400)
  }

  const sym = asset.coinShort.trim().toUpperCase()
  const spots = await fetchUsdSpots(c.env, [sym])
  const fallback = Number(asset.price)
  const unitUsd =
    spots.get(sym)?.usd ?? (Number.isFinite(fallback) && fallback > 0 ? fallback : 0)
  const eqUsd = amount * unitUsd

  const tid = crypto.randomUUID()
  const now = Math.floor(Date.now() / 1000)

  await c.var.db.insert(schema.walletTransactions).values({
    id: tid,
    userId,
    type: 'withdrawal',
    amount: String(amount.toFixed(8)),
    eqAmount: String(eqUsd.toFixed(8)),
    status: 'pending',
    createdAt: now,
    methodType: 'crypto',
    methodName: WALLET_METHOD_WITHDRAWAL_REQUEST,
    methodSymbol: asset.coinShort,
    methodIcon: coincapIconUrl(sym),
    methodIconClass: asset.iconClass ?? undefined,
    note: null,
    counterpartyAddress: destinationAddress.trim(),
    walletAssetId: asset.id,
    expiresAt: null,
  })

  const [u] = await c.var.db
    .select({ email: schema.users.email, publicId: schema.users.publicId })
    .from(schema.users)
    .where(eq(schema.users.id, userId))
    .limit(1)

  const settings = await getPlatformSettingsRow(c.var.db)
  const supportTo = settings?.supportEmail?.trim() ?? ''
  let supportNotified = false
  let emailWarning: string | undefined

  if (supportTo.length > 0 && u) {
    const branding = await getTransactionalEmailBranding(c.env, c.var.db)
    const tpl = supportWalletRequestEmailHtml({
      kind: 'withdrawal',
      userEmail: u.email,
      userPublicId: u.publicId,
      assetSymbol: sym,
      amountNative: amount.toFixed(8).replace(/\.?0+$/, '') || String(amount),
      eqUsd: eqUsd.toFixed(2),
      transactionId: tid,
      destinationAddress: destinationAddress.trim(),
      ...branding,
    })
    const r = await sendEmail(c.env, supportTo, tpl.subject, tpl.html)
    supportNotified = r.ok
    if (!r.ok) emailWarning = r.error
  } else if (!supportTo) {
    console.warn('support_email empty; withdrawal request email skipped')
  }

  return c.json({ id: tid, supportNotified, ...(emailWarning ? { emailWarning } : {}) })
})

wallet.post('/deposit-intent', requireUser, async (c) => {
  const parsed = walletDepositIntentBodySchema.safeParse(await c.req.json().catch(() => ({})))
  if (!parsed.success) return c.json({ error: 'Invalid body' }, 400)

  const userId = c.var.user!.id
  const { walletId, amount } = parsed.data
  const asset = await resolveUserCryptoWallet(c.var.db, userId, walletId)
  if (!asset) return c.json({ error: 'Crypto asset not found' }, 404)

  const sym = asset.coinShort.trim().toUpperCase()
  const spots = await fetchUsdSpots(c.env, [sym])
  const fallback = Number(asset.price)
  const unitUsd =
    spots.get(sym)?.usd ?? (Number.isFinite(fallback) && fallback > 0 ? fallback : 0)
  const eqUsd = amount * unitUsd

  const tid = crypto.randomUUID()
  const now = Math.floor(Date.now() / 1000)
  const expiresAt = now + DEPOSIT_INTENT_TTL_SEC

  await c.var.db.insert(schema.walletTransactions).values({
    id: tid,
    userId,
    type: 'deposit',
    amount: String(amount.toFixed(8)),
    eqAmount: String(eqUsd.toFixed(8)),
    status: 'pending',
    createdAt: now,
    methodType: 'crypto',
    methodName: WALLET_METHOD_DEPOSIT_REQUEST,
    methodSymbol: asset.coinShort,
    methodIcon: coincapIconUrl(sym),
    methodIconClass: asset.iconClass ?? undefined,
    note: null,
    counterpartyAddress: null,
    walletAssetId: asset.id,
    expiresAt,
  })

  const [u] = await c.var.db
    .select({ email: schema.users.email, publicId: schema.users.publicId })
    .from(schema.users)
    .where(eq(schema.users.id, userId))
    .limit(1)

  const settings = await getPlatformSettingsRow(c.var.db)
  const supportTo = settings?.supportEmail?.trim() ?? ''
  let supportNotified = false
  let emailWarning: string | undefined

  if (supportTo.length > 0 && u) {
    const branding = await getTransactionalEmailBranding(c.env, c.var.db)
    const tpl = supportWalletRequestEmailHtml({
      kind: 'deposit',
      userEmail: u.email,
      userPublicId: u.publicId,
      assetSymbol: sym,
      amountNative: amount.toFixed(8).replace(/\.?0+$/, '') || String(amount),
      eqUsd: eqUsd.toFixed(2),
      transactionId: tid,
      depositExpiresAt: expiresAt,
      ...branding,
    })
    const r = await sendEmail(c.env, supportTo, tpl.subject, tpl.html)
    supportNotified = r.ok
    if (!r.ok) emailWarning = r.error
  } else if (!supportTo) {
    console.warn('support_email empty; deposit intent email skipped')
  }

  return c.json({ id: tid, expiresAt, supportNotified, ...(emailWarning ? { emailWarning } : {}) })
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
