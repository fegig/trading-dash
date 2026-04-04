import * as schema from '../db/schema'

/**
 * Columns that exist on `wallet_transactions` before migration 0012.
 * Use when the DB has not applied `0012_wallet_transactions_pending_meta.sql` yet
 * (Drizzle `select()` on the full table would reference missing columns and error).
 */
export const walletTransactionsBaseColumns = {
  id: schema.walletTransactions.id,
  userId: schema.walletTransactions.userId,
  type: schema.walletTransactions.type,
  amount: schema.walletTransactions.amount,
  eqAmount: schema.walletTransactions.eqAmount,
  status: schema.walletTransactions.status,
  createdAt: schema.walletTransactions.createdAt,
  methodType: schema.walletTransactions.methodType,
  methodName: schema.walletTransactions.methodName,
  methodSymbol: schema.walletTransactions.methodSymbol,
  methodIcon: schema.walletTransactions.methodIcon,
  methodIconClass: schema.walletTransactions.methodIconClass,
  note: schema.walletTransactions.note,
} as const
