import { and, eq, isNotNull, lt } from 'drizzle-orm'
import type { AppVariables } from '../types/env'
import * as schema from '../db/schema'
import { WALLET_METHOD_DEPOSIT_REQUEST } from '../lib/wallet-request-constants'

type Db = AppVariables['db']

/** Removes expired deposit intents (pending only). */
export async function deleteExpiredDepositIntents(db: Db): Promise<void> {
  const now = Math.floor(Date.now() / 1000)
  await db
    .delete(schema.walletTransactions)
    .where(
      and(
        eq(schema.walletTransactions.status, 'pending'),
        eq(schema.walletTransactions.methodName, WALLET_METHOD_DEPOSIT_REQUEST),
        isNotNull(schema.walletTransactions.expiresAt),
        lt(schema.walletTransactions.expiresAt, now)
      )
    )
}
