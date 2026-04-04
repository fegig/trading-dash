import { eq, ne } from 'drizzle-orm'
import type { InferSelectModel } from 'drizzle-orm'
import type { AppVariables } from '../types/env'
import * as schema from '../db/schema'

type Db = AppVariables['db']
type CoinRow = InferSelectModel<typeof schema.coins>

/** Default visual color per coin symbol. Falls back to slate. */
export const COIN_COLORS: Record<string, string> = {
  USD: '#22c55e',
  USDT: '#10b981',
  USDC: '#3b82f6',
  BTC: '#f97316',
  ETH: '#8b5cf6',
  SOL: '#22d3ee',
  BNB: '#f59e0b',
  XRP: '#60a5fa',
  ADA: '#6366f1',
  DOGE: '#eab308',
  AVAX: '#ef4444',
  MATIC: '#a855f7',
  DOT: '#ec4899',
  LINK: '#2563eb',
  UNI: '#f43f5e',
  LTC: '#94a3b8',
  TRX: '#ef4444',
  SHIB: '#f97316',
  ATOM: '#6366f1',
  XLM: '#38bdf8',
  BCH: '#22c55e',
  NEAR: '#0ea5e9',
  PEPE: '#4ade80',
}

function coinColor(symbol: string): string {
  return COIN_COLORS[symbol.toUpperCase()] ?? '#94a3b8'
}

function buildWalletId(userId: number, coinId: string): string {
  return `wallet-${userId}-${coinId.toLowerCase()}`
}

function isStablecoin(symbol: string): boolean {
  return ['USDT', 'USDC', 'BUSD', 'DAI', 'TUSD'].includes(symbol.toUpperCase())
}

// ─── Fiat wallet ─────────────────────────────────────────────────────────────

/**
 * Provisions (or updates) the user's fiat wallet using their selected
 * `currencyId` from `fiatCurrencies`.  If the user hasn't chosen a currency
 * yet we default to the first fiat currency row available.
 */
async function provisionFiatWallet(db: Db, userId: number, currencyId: number | null): Promise<void> {
  // Resolve which fiat currency to use
  let fiat: InferSelectModel<typeof schema.fiatCurrencies> | undefined

  if (currencyId != null) {
    const rows = await db
      .select()
      .from(schema.fiatCurrencies)
      .where(eq(schema.fiatCurrencies.id, currencyId))
      .limit(1)
    fiat = rows[0]
  }

  // Fall back to first available currency (usually USD)
  if (!fiat) {
    const rows = await db.select().from(schema.fiatCurrencies).limit(1)
    fiat = rows[0]
  }

  if (!fiat) return // No fiat currencies configured yet

  const code = fiat.code && fiat.code.trim() ? fiat.code.trim() : fiat.name.substring(0, 3).toUpperCase()
  const fiatCoinId = `fiat-${fiat.id}`

  // Check whether this user already has a fiat wallet for this currency
  const existing = await db
    .select({ id: schema.walletAssets.id })
    .from(schema.walletAssets)
    .where(eq(schema.walletAssets.userId, userId))
    // Find any fiat-type asset
    .then((rows) => rows.find((r) => {
      // We'll re-query with assetType filter below — this is just a quick pre-check
      return true
    }))

  const fiatRows = await db
    .select()
    .from(schema.walletAssets)
    .where(eq(schema.walletAssets.userId, userId))
    .then((rows) => rows.filter((r) => r.assetType === 'fiat'))

  if (fiatRows.length > 0) {
    // Update coinId/coinName/coinShort if the user changed their preferred currency
    const current = fiatRows[0]
    if (current.coinId !== fiatCoinId) {
      await db
        .update(schema.walletAssets)
        .set({ coinId: fiatCoinId, coinName: fiat.name, coinShort: code })
        .where(eq(schema.walletAssets.id, current.id))
    }
    return
  }

  // Insert new fiat wallet
  await db.insert(schema.walletAssets).values({
    userId,
    coinId: fiatCoinId,
    coinName: fiat.name,
    coinShort: code,
    coinChain: 'Internal Settlement',
    walletId: `wallet-${userId}-fiat`,
    walletAddress: `${code}-LEDGER-${userId}`,
    userBalance: '0',
    price: '1',
    change24hrs: '0.00',
    coinColor: '#22c55e',
    assetType: 'fiat',
    fundingEligible: true,
    iconClass: 'fi fi-sr-dollar',
    description: `Primary ${fiat.name} balance used for trading, bots, copy trading and investments.`,
  })
}

// ─── Crypto wallets ──────────────────────────────────────────────────────────

/**
 * Ensures every active *crypto* coin in the `coins` catalog has a wallet row
 * for the given user.  Coins with chain === 'Fiat' are skipped (fiat is
 * handled separately via provisionFiatWallet).
 */
async function provisionCryptoWallets(db: Db, userId: number): Promise<number> {
  const [allCoins, existingAssets] = await Promise.all([
    db
      .select()
      .from(schema.coins)
      .where(eq(schema.coins.isActive, true)),
    db
      .select({ coinId: schema.walletAssets.coinId })
      .from(schema.walletAssets)
      .where(eq(schema.walletAssets.userId, userId)),
  ])

  const owned = new Set(existingAssets.map((a) => a.coinId))

  // Skip coins that are fiat-type (chain === 'Fiat') — those are handled above
  const missing = allCoins.filter(
    (c) => !owned.has(c.id) && c.chain.toLowerCase() !== 'fiat'
  )
  if (missing.length === 0) return 0

  await db.insert(schema.walletAssets).values(
    missing.map((c: CoinRow) => ({
      userId,
      coinId: c.id,
      coinName: c.name,
      coinShort: c.symbol,
      coinChain: c.chain,
      walletId: buildWalletId(userId, c.id),
      walletAddress: '',
      userBalance: '0',
      price: '0',
      change24hrs: '0.00',
      coinColor: coinColor(c.symbol),
      assetType: 'crypto' as const,
      fundingEligible: isStablecoin(c.symbol) || c.symbol.toUpperCase() === 'BTC',
      iconUrl: null,
      description: null,
    }))
  )

  return missing.length
}

// ─── Default settings ────────────────────────────────────────────────────────

const DEFAULT_TOGGLES: Array<{
  toggleId: string
  section: 'security' | 'trading' | 'notifications' | 'privacy'
  title: string
  description: string
  enabled: boolean
  icon: string
  tone: 'green' | 'sky' | 'amber' | 'rose'
}> = [
  {
    toggleId: 'two-factor-login',
    section: 'security',
    title: 'Two-factor login challenge',
    description: 'Require a one-time code by email when signing in.',
    enabled: false, // OFF by default — user activates from dashboard prompt
    icon: 'fi fi-rr-shield-check',
    tone: 'green',
  },
  {
    toggleId: 'withdrawal-whitelist',
    section: 'security',
    title: 'Withdrawal address whitelist',
    description: 'Only allow withdrawals to approved wallet destinations.',
    enabled: true,
    icon: 'fi fi-rr-lock',
    tone: 'green',
  },
  {
    toggleId: 'high-risk-confirmation',
    section: 'trading',
    title: 'High-risk trade confirmation',
    description: 'Prompt before orders that exceed your configured leverage or size thresholds.',
    enabled: true,
    icon: 'fi fi-rr-triangle-warning',
    tone: 'amber',
  },
  {
    toggleId: 'copy-trading-pauses',
    section: 'trading',
    title: 'Auto-pause copy trading on drawdown',
    description: 'Stop mirrored allocations when lead traders hit your maximum drawdown tolerance.',
    enabled: true,
    icon: 'fi fi-rr-time-past',
    tone: 'amber',
  },
  {
    toggleId: 'price-alerts',
    section: 'notifications',
    title: 'Price movement alerts',
    description: 'Send instant alerts when markets hit your watchlist thresholds.',
    enabled: true,
    icon: 'fi fi-rr-bell-ring',
    tone: 'sky',
  },
  {
    toggleId: 'product-updates',
    section: 'notifications',
    title: 'Bot and investment updates',
    description: 'Notify you when product performance, pricing, or availability changes.',
    enabled: false,
    icon: 'fi fi-rr-megaphone',
    tone: 'sky',
  },
  {
    toggleId: 'public-profile',
    section: 'privacy',
    title: 'Show profile in leaderboards',
    description: 'Display your nickname and aggregate performance on public ranking surfaces.',
    enabled: false,
    icon: 'fi fi-rr-eye',
    tone: 'rose',
  },
  {
    toggleId: 'analytics-sharing',
    section: 'privacy',
    title: 'Share anonymous analytics',
    description: 'Help improve execution quality with fully anonymised product usage metrics.',
    enabled: true,
    icon: 'fi fi-rr-chart-histogram',
    tone: 'rose',
  },
]

/**
 * Inserts default setting_toggles rows for a user if they have none yet.
 * Idempotent — safe to call on every login.
 */
export async function provisionDefaultSettings(db: Db, userId: number): Promise<void> {
  const existing = await db
    .select({ toggleId: schema.settingToggles.toggleId })
    .from(schema.settingToggles)
    .where(eq(schema.settingToggles.userId, userId))

  if (existing.length >= DEFAULT_TOGGLES.length) return

  const existingIds = new Set(existing.map((r) => r.toggleId))
  const toInsert = DEFAULT_TOGGLES.filter((t) => !existingIds.has(t.toggleId))
  if (toInsert.length === 0) return

  await db.insert(schema.settingToggles).values(
    toInsert.map((t) => ({ ...t, userId }))
  )
}

// ─── Main export ─────────────────────────────────────────────────────────────

/**
 * Full user provisioning: fiat wallet + crypto wallets + default settings.
 * Always awaited — never fire-and-forget — so callers can rely on the DB
 * being ready before returning a response to the client.
 */
export async function provisionUserWallets(db: Db, userId: number): Promise<void> {
  const [userRow] = await db
    .select({ currencyId: schema.users.currencyId })
    .from(schema.users)
    .where(eq(schema.users.id, userId))
    .limit(1)

  await Promise.all([
    provisionFiatWallet(db, userId, userRow?.currencyId ?? null),
    provisionCryptoWallets(db, userId),
    provisionDefaultSettings(db, userId),
  ])
}

/**
 * When admin adds a new coin, provision it for every user who doesn't have it.
 */
export async function provisionCoinForAllUsers(db: Db, coinId: string): Promise<number> {
  const [coin] = await db.select().from(schema.coins).where(eq(schema.coins.id, coinId)).limit(1)
  if (!coin || !coin.isActive || coin.chain.toLowerCase() === 'fiat') return 0

  const already = await db
    .select({ userId: schema.walletAssets.userId })
    .from(schema.walletAssets)
    .where(eq(schema.walletAssets.coinId, coinId))
  const alreadySet = new Set(already.map((r) => r.userId))

  const allUsers = await db
    .select({ id: schema.users.id })
    .from(schema.users)
    .where(ne(schema.users.role, 'admin'))
  const toProvision = allUsers.filter((u) => !alreadySet.has(u.id))
  if (toProvision.length === 0) return 0

  await db.insert(schema.walletAssets).values(
    toProvision.map((u) => ({
      userId: u.id,
      coinId: coin.id,
      coinName: coin.name,
      coinShort: coin.symbol,
      coinChain: coin.chain,
      walletId: buildWalletId(u.id, coin.id),
      walletAddress: '',
      userBalance: '0',
      price: '0',
      change24hrs: '0.00',
      coinColor: coinColor(coin.symbol),
      assetType: 'crypto' as const,
      fundingEligible: isStablecoin(coin.symbol) || coin.symbol.toUpperCase() === 'BTC',
      iconUrl: null,
      description: null,
    }))
  )

  return toProvision.length
}
