import { and, eq } from 'drizzle-orm'
import type { Env } from '../types/env'
import type { AppVariables } from '../types/env'
import * as schema from '../db/schema'
import { fetchUsdSpots } from './cc-prices'
import { creditUserFiatUsd } from './wallet-ledger'
import { provisionUserWallets } from '../services/wallet-provisioning'

type Db = AppVariables['db']

/**
 * Converts each user's balance in `coinId` to fiat (USD value via spot) and deletes crypto wallet rows.
 */
export async function liquidateCoinWalletRows(
  env: Env,
  db: Db,
  coinId: string
): Promise<{ rowsDeleted: number; creditedUsd: number; errors: string[] }> {
  const rows = await db
    .select()
    .from(schema.walletAssets)
    .where(
      and(eq(schema.walletAssets.coinId, coinId), eq(schema.walletAssets.assetType, 'crypto'))
    )

  const userIds = [...new Set(rows.map((r) => r.userId))]
  for (const uid of userIds) {
    await provisionUserWallets(db, uid)
  }

  const symbols = [...new Set(rows.map((r) => r.coinShort.trim().toUpperCase()).filter(Boolean))]
  const spots = symbols.length > 0 ? await fetchUsdSpots(env, symbols) : new Map()

  let rowsDeleted = 0
  let creditedUsd = 0
  const errors: string[] = []

  for (const row of rows) {
    const bal = Number(row.userBalance)

    if (!Number.isFinite(bal) || bal <= 0) {
      await db.delete(schema.walletAssets).where(eq(schema.walletAssets.id, row.id))
      rowsDeleted++
      continue
    }

    const sym = row.coinShort.trim().toUpperCase()
    let unitUsd = spots.get(sym)?.usd ?? 0
    if (!(unitUsd > 0)) {
      const f = Number(row.price)
      unitUsd = Number.isFinite(f) && f > 0 ? f : 0
    }

    const usdGross = bal * unitUsd
    if (!(usdGross > 1e-8)) {
      await db.delete(schema.walletAssets).where(eq(schema.walletAssets.id, row.id))
      rowsDeleted++
      continue
    }

    const res = await creditUserFiatUsd(
      env,
      db,
      row.userId,
      usdGross,
      `Your ${row.coinShort} balance was converted to your fiat wallet because this asset is no longer supported for spot holdings.`,
      'Asset conversion'
    )

    if (!res.ok) {
      errors.push(`userId ${row.userId}: ${res.error}`)
      continue
    }

    creditedUsd += usdGross
    await db.delete(schema.walletAssets).where(eq(schema.walletAssets.id, row.id))
    rowsDeleted++
  }

  return { rowsDeleted, creditedUsd, errors }
}
