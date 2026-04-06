/** MySQL / Drizzle errors when migration 0012 columns are missing on `wallet_transactions`. */
export function isMissingWalletTxExtendedColumnsError(err: unknown): boolean {
  const msg = err instanceof Error ? err.message : String(err)
  return (
    /Unknown column ['`]?expires_at['`]?/i.test(msg) ||
    /Unknown column ['`]?counterparty_address['`]?/i.test(msg) ||
    /Unknown column ['`]?wallet_asset_id['`]?/i.test(msg) ||
    /\b1054\b/.test(msg)
  )
}

export const WALLET_TX_MIGRATION_HINT =
  'Apply database migration 0012_wallet_transactions_pending_meta.sql (adds expires_at, counterparty_address, wallet_asset_id on wallet_transactions).'
