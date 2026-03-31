/**
 * Deterministic catalog-wide deposit address (one per coin symbol, shared by all users).
 * Mirrors legacy per-user address shape for UI consistency.
 */
export function catalogDepositAddress(symbol: string): string {
  const upper = symbol.toUpperCase()
  const seed = `GLOBAL-${upper}-CATALOG`
  const rand = seed
    .replace(/[^a-zA-Z0-9]/g, '')
    .toUpperCase()
    .padEnd(24, '0')
    .substring(0, 24)
  if (upper === 'BTC') return `1${rand}`
  if (upper === 'TRX' || upper === 'USDT') return `T${rand}`
  return `0x${rand.toLowerCase()}`
}
