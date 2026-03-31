import { and, eq, inArray } from 'drizzle-orm'
import type { InferSelectModel } from 'drizzle-orm'
import type { Env } from '../types/env'
import type { AppVariables } from '../types/env'
import * as schema from '../db/schema'
import { fetchUsdSpots } from './cc-prices'

type Db = AppVariables['db']

const CONVERT_FEE = 0.0035

export async function resolveUsdPerFiatUnit(
  env: Env,
  db: Db,
  userId: number
): Promise<{ code: string; usdPerUnit: number; fiatRow: typeof schema.walletAssets.$inferSelect } | null> {
  const [fiat] = await db
    .select()
    .from(schema.walletAssets)
    .where(and(eq(schema.walletAssets.userId, userId), eq(schema.walletAssets.assetType, 'fiat')))
    .limit(1)
  if (!fiat) return null
  const code = (fiat.coinShort && fiat.coinShort.trim()) ? fiat.coinShort.trim().toUpperCase() : 'USD'
  if (code === 'USD') return { code, usdPerUnit: 1, fiatRow: fiat }
  const spots = await fetchUsdSpots(env, [code])
  const spot = spots.get(code)
  const fallback = Number(fiat.price)
  const usdPerUnit =
    spot && spot.usd > 0 ? spot.usd : Number.isFinite(fallback) && fallback > 0 ? fallback : 1
  return { code, usdPerUnit, fiatRow: fiat }
}

function fiatUnitsForUsd(amountUsd: number, usdPerFiatUnit: number): number {
  if (!Number.isFinite(amountUsd) || amountUsd <= 0) return 0
  if (!Number.isFinite(usdPerFiatUnit) || usdPerFiatUnit <= 0) return amountUsd
  return amountUsd / usdPerFiatUnit
}

export async function spendUserFiatUsd(
  env: Env,
  db: Db,
  userId: number,
  amountUsd: number,
  note: string,
  methodName: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  if (!Number.isFinite(amountUsd) || amountUsd <= 0) return { ok: false, error: 'Invalid amount' }
  const resolved = await resolveUsdPerFiatUnit(env, db, userId)
  if (!resolved) return { ok: false, error: 'No fiat wallet' }
  const { fiatRow, usdPerUnit } = resolved
  const debitFiatUnits = Number(fiatUnitsForUsd(amountUsd, usdPerUnit).toFixed(8))
  const bal = Number(fiatRow.userBalance)
  if (bal + 1e-12 < debitFiatUnits) return { ok: false, error: 'Insufficient balance' }
  const next = (bal - debitFiatUnits).toFixed(8)
  await db
    .update(schema.walletAssets)
    .set({ userBalance: next })
    .where(eq(schema.walletAssets.id, fiatRow.id))

  const tid = crypto.randomUUID()
  const now = Math.floor(Date.now() / 1000)
  await db.insert(schema.walletTransactions).values({
    id: tid,
    userId,
    type: 'withdrawal',
    amount: String(debitFiatUnits.toFixed(8)),
    eqAmount: String(amountUsd.toFixed(8)),
    status: 'completed',
    createdAt: now,
    methodType: 'fiat',
    methodName,
    methodSymbol: fiatRow.coinShort,
    methodIcon: fiatRow.iconUrl ?? undefined,
    methodIconClass: fiatRow.iconClass ?? undefined,
    note,
  })
  return { ok: true }
}

export async function creditUserFiatUsd(
  env: Env,
  db: Db,
  userId: number,
  amountUsd: number,
  note: string,
  methodName: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  if (!Number.isFinite(amountUsd) || amountUsd <= 0) return { ok: false, error: 'Invalid amount' }
  const resolved = await resolveUsdPerFiatUnit(env, db, userId)
  if (!resolved) return { ok: false, error: 'No fiat wallet' }
  const { fiatRow, usdPerUnit } = resolved
  const creditFiatUnits = Number(fiatUnitsForUsd(amountUsd, usdPerUnit).toFixed(8))
  const bal = Number(fiatRow.userBalance)
  const next = (bal + creditFiatUnits).toFixed(8)
  await db
    .update(schema.walletAssets)
    .set({ userBalance: next })
    .where(eq(schema.walletAssets.id, fiatRow.id))

  const tid = crypto.randomUUID()
  const now = Math.floor(Date.now() / 1000)
  await db.insert(schema.walletTransactions).values({
    id: tid,
    userId,
    type: 'deposit',
    amount: String(creditFiatUnits.toFixed(8)),
    eqAmount: String(amountUsd.toFixed(8)),
    status: 'completed',
    createdAt: now,
    methodType: 'fiat',
    methodName,
    methodSymbol: fiatRow.coinShort,
    methodIcon: fiatRow.iconUrl ?? undefined,
    methodIconClass: fiatRow.iconClass ?? undefined,
    note,
  })
  return { ok: true }
}

/** Positive delta credits fiat (USD); negative spends |delta| in USD equivalent. */
export async function adjustFiatByUsd(
  env: Env,
  db: Db,
  userId: number,
  deltaUsd: number,
  note: string,
  methodName: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  if (!Number.isFinite(deltaUsd) || Math.abs(deltaUsd) < 1e-12) return { ok: true }
  if (deltaUsd > 0) return creditUserFiatUsd(env, db, userId, deltaUsd, note, methodName)
  return spendUserFiatUsd(env, db, userId, Math.abs(deltaUsd), note, methodName)
}

export type WalletConvertResult =
  | {
      ok: true
      fromAmount: number
      toAmount: number
      usdGross: number
      feeUsd: number
      netUsd: number
    }
  | { ok: false; error: string }

export async function executeWalletConvert(
  env: Env,
  db: Db,
  userId: number,
  fromWalletId: string,
  toWalletId: string,
  fromAmount: number
): Promise<WalletConvertResult> {
  if (fromWalletId === toWalletId) return { ok: false, error: 'Cannot convert to the same wallet' }
  if (!Number.isFinite(fromAmount) || fromAmount <= 0) return { ok: false, error: 'Invalid amount' }

  const joined = await db
    .select({
      a: schema.walletAssets,
      catSym: schema.coins.symbol,
    })
    .from(schema.walletAssets)
    .leftJoin(schema.coins, eq(schema.walletAssets.coinId, schema.coins.id))
    .where(
      and(eq(schema.walletAssets.userId, userId), inArray(schema.walletAssets.walletId, [fromWalletId, toWalletId]))
    )

  const fromPack = joined.find((j) => j.a.walletId === fromWalletId)
  const toPack = joined.find((j) => j.a.walletId === toWalletId)
  const fromRow = fromPack?.a
  const toRow = toPack?.a
  if (!fromRow || !toRow) return { ok: false, error: 'Wallet not found' }

  const fromPrec = fromRow.assetType === 'fiat' ? 2 : 8
  const fromDed = Number(fromAmount.toFixed(fromPrec))
  const bal = Number(fromRow.userBalance)
  if (!Number.isFinite(fromDed) || fromDed <= 0) return { ok: false, error: 'Invalid amount' }
  if (bal + 1e-12 < fromDed) return { ok: false, error: 'Insufficient balance' }

  const fromSym = (fromPack.catSym ?? fromRow.coinShort).trim().toUpperCase()
  const toSym = (toPack.catSym ?? toRow.coinShort).trim().toUpperCase()

  const fiatCtx = await resolveUsdPerFiatUnit(env, db, userId)
  const fiatCode = fiatCtx?.code ?? 'USD'
  const syms = [...new Set([fromSym, toSym, fiatCode])]
  const spots = await fetchUsdSpots(env, syms)

  function px(row: InferSelectModel<typeof schema.walletAssets>, sym: string): number {
    const s = spots.get(sym)
    if (s && s.usd > 0) return s.usd
    const n = Number(row.price)
    return Number.isFinite(n) && n > 0 ? n : 0
  }

  const fromPrice = px(fromRow, fromSym)
  const toPrice = px(toRow, toSym)
  if (fromPrice <= 0 || toPrice <= 0) return { ok: false, error: 'Price unavailable for conversion' }

  const usdGross = fromDed * fromPrice
  const feeUsd = usdGross * CONVERT_FEE
  const netUsd = usdGross - feeUsd
  if (netUsd <= 0) return { ok: false, error: 'Amount too small after fee' }

  const toPrec = toRow.assetType === 'fiat' ? 2 : 8
  const toAmount = Number((netUsd / toPrice).toFixed(toPrec))
  if (toAmount <= 0) return { ok: false, error: 'Output amount too small' }

  const now = Math.floor(Date.now() / 1000)
  const baseNote = `Convert ${fromDed} ${fromSym} → ${toAmount} ${toSym} (fee ≈ ${feeUsd.toFixed(4)} USD).`

  await db.transaction(async (tx) => {
    const fbal = Number(fromRow.userBalance)
    const tbal = Number(toRow.userBalance)
    const nextFrom = (fbal - fromDed).toFixed(8)
    const nextTo = (tbal + toAmount).toFixed(8)

    await tx
      .update(schema.walletAssets)
      .set({ userBalance: nextFrom })
      .where(eq(schema.walletAssets.id, fromRow.id))
    await tx
      .update(schema.walletAssets)
      .set({ userBalance: nextTo })
      .where(eq(schema.walletAssets.id, toRow.id))

    await tx.insert(schema.walletTransactions).values({
      id: crypto.randomUUID(),
      userId,
      type: 'withdrawal',
      amount: String(fromDed.toFixed(8)),
      eqAmount: String(usdGross.toFixed(8)),
      status: 'completed',
      createdAt: now,
      methodType: fromRow.assetType === 'fiat' ? 'fiat' : 'crypto',
      methodName: `Convert out · ${fromSym}`,
      methodSymbol: fromRow.coinShort,
      methodIcon: fromRow.iconUrl ?? undefined,
      methodIconClass: fromRow.iconClass ?? undefined,
      note: baseNote,
    })

    await tx.insert(schema.walletTransactions).values({
      id: crypto.randomUUID(),
      userId,
      type: 'deposit',
      amount: String(toAmount.toFixed(8)),
      eqAmount: String(netUsd.toFixed(8)),
      status: 'completed',
      createdAt: now + 1,
      methodType: toRow.assetType === 'fiat' ? 'fiat' : 'crypto',
      methodName: `Convert in · ${toSym}`,
      methodSymbol: toRow.coinShort,
      methodIcon: toRow.iconUrl ?? undefined,
      methodIconClass: toRow.iconClass ?? undefined,
      note: baseNote,
    })
  })

  return { ok: true, fromAmount: fromDed, toAmount, usdGross, feeUsd, netUsd }
}
