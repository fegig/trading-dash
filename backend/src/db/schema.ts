import {
  mysqlTable,
  varchar,
  int,
  bigint,
  text,
  boolean,
  json,
  mysqlEnum,
  timestamp,
  decimal,
  index,
  primaryKey,
} from 'drizzle-orm/mysql-core'
import { relations } from 'drizzle-orm'

export const users = mysqlTable(
  'users',
  {
    id: int('id').primaryKey().autoincrement(),
    publicId: varchar('public_id', { length: 36 }).notNull().unique(),
    email: varchar('email', { length: 255 }).notNull().unique(),
    passwordHash: varchar('password_hash', { length: 255 }),
    currencyId: int('currency_id'),
    verificationStatus: int('verification_status').notNull().default(0),
    role: varchar('role', { length: 20 }).notNull().default('user'),
    refBy: varchar('ref_by', { length: 36 }),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (t) => [index('users_email_idx').on(t.email)]
)

/** One row per user: profile + onboarding flags (no JSON blob). */
export const userBios = mysqlTable('user_bios', {
  id: int('id').primaryKey().autoincrement(),
  userId: int('user_id')
    .notNull()
    .unique()
    .references(() => users.id, { onDelete: 'cascade' }),
  firstName: varchar('first_name', { length: 128 }).notNull().default(''),
  lastName: varchar('last_name', { length: 128 }).notNull().default(''),
  phone: varchar('phone', { length: 64 }).notNull().default(''),
  country: varchar('country', { length: 128 }).notNull().default(''),
  loginOtpEnabled: boolean('login_otp_enabled').notNull().default(false),
  onboardingWelcomeSent: boolean('onboarding_welcome_sent').notNull().default(false),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
})

export const sessions = mysqlTable('sessions', {
  id: varchar('id', { length: 64 }).primaryKey(),
  userId: int('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  expiresAt: bigint('expires_at', { mode: 'number' }).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})

export const otpMessages = mysqlTable('otp_messages', {
  id: int('id').primaryKey().autoincrement(),
  userId: int('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  messageId: varchar('message_id', { length: 64 }).notNull(),
  codeHash: varchar('code_hash', { length: 128 }).notNull(),
  expiresAt: bigint('expires_at', { mode: 'number' }).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})

export const authTokens = mysqlTable('auth_tokens', {
  id: int('id').primaryKey().autoincrement(),
  userId: int('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  token: varchar('token', { length: 512 }).notNull(),
  tokenType: varchar('token_type', { length: 32 }).notNull().default('session'),
  expiresAt: bigint('expires_at', { mode: 'number' }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})

export const fiatCurrencies = mysqlTable('fiat_currencies', {
  id: int('id').primaryKey().autoincrement(),
  name: varchar('name', { length: 64 }).notNull(),
  symbol: varchar('symbol', { length: 8 }).notNull(),
  /** ISO 4217 currency code, e.g. USD, EUR, GBP, NGN */
  code: varchar('code', { length: 8 }).notNull().default(''),
})

/** Platform-wide dashboard notices (coin catalog changes, etc.). */
export const globalNotices = mysqlTable(
  'global_notices',
  {
    id: varchar('id', { length: 36 }).primaryKey(),
    kind: varchar('kind', { length: 32 }).notNull(),
    title: varchar('title', { length: 255 }).notNull(),
    body: text('body').notNull(),
    metaJson: text('meta_json'),
    createdAt: bigint('created_at', { mode: 'number' }).notNull(),
    expiresAt: bigint('expires_at', { mode: 'number' }),
  },
  (t) => [index('global_notices_created_idx').on(t.createdAt)]
)

export const userNoticeDismissals = mysqlTable(
  'user_notice_dismissals',
  {
    userId: int('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    noticeId: varchar('notice_id', { length: 36 }).notNull(),
    dismissedAt: bigint('dismissed_at', { mode: 'number' }).notNull(),
  },
  (t) => [primaryKey({ columns: [t.userId, t.noticeId] })]
)

export const walletAssets = mysqlTable(
  'wallet_assets',
  {
    id: int('id').primaryKey().autoincrement(),
    userId: int('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    coinId: varchar('coin_id', { length: 32 }).notNull(),
    walletAddress: varchar('wallet_address', { length: 128 }).notNull(),
    userBalance: decimal('user_balance', { precision: 24, scale: 8 }).notNull(),
    coinName: varchar('coin_name', { length: 64 }).notNull(),
    coinShort: varchar('coin_short', { length: 16 }).notNull(),
    coinChain: varchar('coin_chain', { length: 32 }).notNull(),
    walletId: varchar('wallet_id', { length: 64 }).notNull(),
    price: varchar('price', { length: 32 }).notNull(),
    change24hrs: varchar('change_24hrs', { length: 16 }).notNull(),
    coinColor: varchar('coin_color', { length: 16 }).notNull(),
    assetType: mysqlEnum('asset_type', ['crypto', 'fiat']).notNull(),
    fundingEligible: boolean('funding_eligible').notNull().default(true),
    iconUrl: varchar('icon_url', { length: 512 }),
    iconClass: varchar('icon_class', { length: 64 }),
    description: text('description'),
  },
  (t) => [index('wallet_user_idx').on(t.userId)]
)

export const walletTransactions = mysqlTable(
  'wallet_transactions',
  {
    id: varchar('id', { length: 36 }).primaryKey(),
    userId: int('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    type: mysqlEnum('type', [
      'buy',
      'sell',
      'transfer',
      'withdrawal',
      'deposit',
      'fee',
      'interest',
      'dividend',
      'tax',
      'other',
    ]).notNull(),
    amount: decimal('amount', { precision: 24, scale: 8 }).notNull(),
    eqAmount: decimal('eq_amount', { precision: 24, scale: 8 }).notNull(),
    status: mysqlEnum('status', ['pending', 'completed', 'failed', 'cancelled']).notNull(),
    createdAt: bigint('created_at', { mode: 'number' }).notNull(),
    methodType: mysqlEnum('method_type', ['bank', 'card', 'crypto', 'fiat', 'other']).notNull(),
    methodName: varchar('method_name', { length: 128 }).notNull(),
    methodSymbol: varchar('method_symbol', { length: 16 }).notNull(),
    methodIcon: varchar('method_icon', { length: 512 }),
    methodIconClass: varchar('method_icon_class', { length: 64 }),
    note: text('note'),
  },
  (t) => [index('wt_user_idx').on(t.userId)]
)

export const trades = mysqlTable(
  'trades',
  {
    id: varchar('id', { length: 36 }).primaryKey(),
    userId: int('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    pair: varchar('pair', { length: 32 }).notNull(),
    base: varchar('base', { length: 16 }).notNull(),
    quote: varchar('quote', { length: 16 }).notNull(),
    option: mysqlEnum('option', ['buy', 'sell']).notNull(),
    direction: mysqlEnum('direction', ['long', 'short']).notNull(),
    entryTime: bigint('entry_time', { mode: 'number' }).notNull(),
    entryPrice: decimal('entry_price', { precision: 24, scale: 8 }).notNull(),
    invested: decimal('invested', { precision: 24, scale: 8 }).notNull(),
    currency: varchar('currency', { length: 8 }).notNull(),
    closingTime: bigint('closing_time', { mode: 'number' }),
    closingPrice: decimal('closing_price', { precision: 24, scale: 8 }),
    status: mysqlEnum('status', ['open', 'completed', 'pending', 'canceled', 'failed']).notNull(),
    roi: decimal('roi', { precision: 24, scale: 8 }),
    leverage: int('leverage').notNull().default(1),
    size: decimal('size', { precision: 24, scale: 8 }).notNull(),
    margin: decimal('margin', { precision: 24, scale: 8 }).notNull(),
    marginPercentage: decimal('margin_percentage', { precision: 8, scale: 4 }).notNull(),
    marginType: mysqlEnum('margin_type', ['isolated', 'cross']).notNull(),
    pnl: decimal('pnl', { precision: 24, scale: 8 }).notNull(),
    sl: decimal('sl', { precision: 24, scale: 8 }).notNull(),
    tp: decimal('tp', { precision: 24, scale: 8 }).notNull(),
    fees: decimal('fees', { precision: 24, scale: 8 }).notNull(),
    liquidationPrice: decimal('liquidation_price', { precision: 24, scale: 8 }).notNull(),
    marketPrice: decimal('market_price', { precision: 24, scale: 8 }).notNull(),
    strategy: varchar('strategy', { length: 128 }).notNull(),
    confidence: int('confidence').notNull(),
    riskReward: varchar('risk_reward', { length: 32 }).notNull(),
    note: text('note').notNull(),
    setup: varchar('setup', { length: 256 }).notNull(),
    fundedWith: varchar('funded_with', { length: 64 }).notNull(),
    executionVenue: varchar('execution_venue', { length: 64 }).notNull(),
    tags: json('tags').$type<string[]>().notNull(),
  },
  (t) => [index('trades_user_idx').on(t.userId), index('trades_status_idx').on(t.status)]
)

export const activityLogs = mysqlTable(
  'activity_logs',
  {
    id: varchar('id', { length: 36 }).primaryKey(),
    userId: int('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    time: bigint('time', { mode: 'number' }).notNull(),
    ipAddress: varchar('ip_address', { length: 64 }).notNull(),
    location: varchar('location', { length: 128 }).notNull(),
    device: varchar('device', { length: 256 }).notNull(),
    status: mysqlEnum('status', ['success', 'review', 'blocked']).notNull(),
  },
  (t) => [index('al_user_idx').on(t.userId)]
)

export const affiliateReferrals = mysqlTable(
  'affiliate_referrals',
  {
    id: int('id').primaryKey().autoincrement(),
    referrerUserId: int('referrer_user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    referredUserId: int('referred_user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (t) => [index('ar_referrer_idx').on(t.referrerUserId)]
)

export const faqCategories = mysqlTable('faq_categories', {
  id: int('id').primaryKey().autoincrement(),
  name: varchar('name', { length: 128 }).notNull(),
  sortOrder: int('sort_order').notNull().default(0),
})

export const faqItems = mysqlTable(
  'faq_items',
  {
    id: int('id').primaryKey().autoincrement(),
    categoryId: int('category_id')
      .notNull()
      .references(() => faqCategories.id, { onDelete: 'cascade' }),
    question: text('question').notNull(),
    answer: text('answer').notNull(),
    sortOrder: int('sort_order').notNull().default(0),
  },
  (t) => [index('faq_cat_idx').on(t.categoryId)]
)

export const settingToggles = mysqlTable(
  'setting_toggles',
  {
    /** Semantic key for this toggle, e.g. 'two-factor-login'. Combined with userId as composite PK. */
    toggleId: varchar('toggle_id', { length: 64 }).notNull(),
    userId: int('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    section: mysqlEnum('section', ['security', 'trading', 'notifications', 'privacy']).notNull(),
    title: varchar('title', { length: 256 }).notNull(),
    description: text('description').notNull(),
    enabled: boolean('enabled').notNull().default(false),
    icon: varchar('icon', { length: 64 }).notNull(),
    tone: mysqlEnum('tone', ['green', 'sky', 'amber', 'rose']).notNull(),
  },
  (t) => [primaryKey({ columns: [t.userId, t.toggleId] }), index('st_user_idx').on(t.userId)]
)

export const verificationSteps = mysqlTable(
  'verification_steps',
  {
    id: varchar('id', { length: 64 }).primaryKey(),
    userId: int('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    title: varchar('title', { length: 256 }).notNull(),
    body: text('body').notNull(),
    status: mysqlEnum('status', ['complete', 'active', 'upcoming']).notNull(),
    eta: varchar('eta', { length: 64 }).notNull(),
    action: varchar('action', { length: 128 }).notNull(),
    sortOrder: int('sort_order').notNull().default(0),
  },
  (t) => [index('vs_user_idx').on(t.userId)]
)

export const verificationDocuments = mysqlTable(
  'verification_documents',
  {
    id: varchar('id', { length: 64 }).primaryKey(),
    userId: int('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    title: varchar('title', { length: 256 }).notNull(),
    subtitle: varchar('subtitle', { length: 256 }).notNull(),
    status: mysqlEnum('status', ['approved', 'review', 'missing']).notNull(),
    updatedAt: bigint('updated_at', { mode: 'number' }).notNull(),
    /** R2 object key — private; never expose to client */
    r2Key: varchar('r2_key', { length: 512 }),
    originalFilename: varchar('original_filename', { length: 512 }),
    mimeType: varchar('mime_type', { length: 128 }),
    fileSize: int('file_size'),
  },
  (t) => [index('vd_user_idx').on(t.userId)]
)

export const verificationBenefits = mysqlTable(
  'verification_benefits',
  {
    id: varchar('id', { length: 64 }).primaryKey(),
    userId: int('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    title: varchar('title', { length: 256 }).notNull(),
    body: text('body').notNull(),
    icon: varchar('icon', { length: 64 }).notNull(),
    sortOrder: int('sort_order').notNull().default(0),
  },
  (t) => [index('vb_user_idx').on(t.userId)]
)

export const verificationOverviewRows = mysqlTable(
  'verification_overview',
  {
    userId: int('user_id')
      .primaryKey()
      .references(() => users.id, { onDelete: 'cascade' }),
    tier: varchar('tier', { length: 64 }).notNull(),
    dailyLimit: varchar('daily_limit', { length: 64 }).notNull(),
    payoutSpeed: varchar('payout_speed', { length: 64 }).notNull(),
    nextReview: varchar('next_review', { length: 64 }).notNull(),
  },
  (t) => []
)

export const tradingBots = mysqlTable('trading_bots', {
  id: varchar('id', { length: 64 }).primaryKey(),
  name: varchar('name', { length: 128 }).notNull(),
  strapline: varchar('strapline', { length: 256 }).notNull(),
  description: text('description').notNull(),
  strategy: varchar('strategy', { length: 128 }).notNull(),
  priceUsd: decimal('price_usd', { precision: 12, scale: 2 }).notNull(),
  monthlyTarget: varchar('monthly_target', { length: 32 }).notNull(),
  winRate: int('win_rate').notNull(),
  maxDrawdown: int('max_drawdown').notNull(),
  markets: json('markets').$type<string[]>().notNull(),
  cadence: varchar('cadence', { length: 64 }).notNull(),
  guardrails: json('guardrails').$type<string[]>().notNull(),
  subscriptionDays: int('subscription_days').default(30),
})

export const copyTraders = mysqlTable('copy_traders', {
  id: varchar('id', { length: 64 }).primaryKey(),
  name: varchar('name', { length: 128 }).notNull(),
  handle: varchar('handle', { length: 64 }).notNull(),
  specialty: varchar('specialty', { length: 128 }).notNull(),
  followers: int('followers').notNull(),
  winRate: int('win_rate').notNull(),
  maxDrawdown: int('max_drawdown').notNull(),
  minAllocation: int('min_allocation').notNull(),
  feePct: int('fee_pct').notNull(),
  monthlyReturn: varchar('monthly_return', { length: 32 }).notNull(),
  bio: text('bio').notNull(),
  focusPairs: json('focus_pairs').$type<string[]>().notNull(),
  capacity: mysqlEnum('capacity', ['Open', 'Limited']).notNull(),
})

export const investmentProducts = mysqlTable('investment_products', {
  id: varchar('id', { length: 64 }).primaryKey(),
  name: varchar('name', { length: 128 }).notNull(),
  subtitle: varchar('subtitle', { length: 256 }).notNull(),
  category: mysqlEnum('category', ['Short Term', 'Long Term', 'Retirement']).notNull(),
  vehicle: varchar('vehicle', { length: 128 }).notNull(),
  apy: decimal('apy', { precision: 8, scale: 4 }).notNull(),
  termDays: int('term_days').notNull(),
  minAmount: int('min_amount').notNull(),
  liquidity: varchar('liquidity', { length: 64 }).notNull(),
  distribution: varchar('distribution', { length: 64 }).notNull(),
  fundedPct: int('funded_pct').notNull(),
  risk: mysqlEnum('risk', ['Low', 'Moderate', 'High']).notNull(),
  focus: json('focus').$type<string[]>().notNull(),
  objective: text('objective').notNull(),
  suitableFor: text('suitable_for').notNull(),
  description: text('description').notNull(),
})

export const userBotSubscriptions = mysqlTable(
  'user_bot_subscriptions',
  {
    id: int('id').primaryKey().autoincrement(),
    userId: int('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    botId: varchar('bot_id', { length: 64 }).notNull(),
    subscribedAt: bigint('subscribed_at', { mode: 'number' }).notNull(),
    expiresAt: bigint('expires_at', { mode: 'number' }).notNull(),
    lifetimePnlUsd: decimal('lifetime_pnl_usd', { precision: 24, scale: 8 }).notNull(),
  },
  (t) => [index('ubs_user_idx').on(t.userId)]
)

export const userCopyAllocations = mysqlTable(
  'user_copy_allocations',
  {
    id: int('id').primaryKey().autoincrement(),
    userId: int('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    traderId: varchar('trader_id', { length: 64 }).notNull(),
    amount: decimal('amount', { precision: 24, scale: 8 }).notNull(),
    startedAt: bigint('started_at', { mode: 'number' }).notNull(),
    expiresAt: bigint('expires_at', { mode: 'number' }).notNull(),
    lifetimePnlUsd: decimal('lifetime_pnl_usd', { precision: 24, scale: 8 }).notNull(),
  },
  (t) => [index('uca_user_idx').on(t.userId)]
)

export const userFollowingTraders = mysqlTable(
  'user_following_traders',
  {
    userId: int('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    traderId: varchar('trader_id', { length: 64 }).notNull(),
  },
  (t) => [primaryKey({ columns: [t.userId, t.traderId] }), index('uft_user_idx').on(t.userId)]
)

export const userInvestmentPositions = mysqlTable(
  'user_investment_positions',
  {
    id: int('id').primaryKey().autoincrement(),
    userId: int('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    productId: varchar('product_id', { length: 64 }).notNull(),
    amount: decimal('amount', { precision: 24, scale: 8 }).notNull(),
    startedAt: bigint('started_at', { mode: 'number' }).notNull(),
  },
  (t) => [index('uip_user_idx').on(t.userId)]
)

/** Global catalog of tradable coins (not per-user wallet rows). */
export const coins = mysqlTable('coins', {
  id: varchar('id', { length: 32 }).primaryKey(),
  name: varchar('name', { length: 64 }).notNull(),
  symbol: varchar('symbol', { length: 16 }).notNull(),
  chain: varchar('chain', { length: 32 }).notNull(),
  confirmLevel: int('confirm_level').notNull().default(0),
  iconUrl: varchar('icon_url', { length: 512 }),
  /** Shared deposit address for this asset (not duplicated on `wallet_assets`). */
  depositAddress: varchar('deposit_address', { length: 128 }).notNull().default(''),
  isActive: boolean('is_active').notNull().default(true),
})

/** Cron audit: one row per bot run per subscription (rate-limit / observability). */
export const botTradeRuns = mysqlTable(
  'bot_trade_runs',
  {
    id: varchar('id', { length: 36 }).primaryKey(),
    userId: int('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    botId: varchar('bot_id', { length: 64 }).notNull(),
    subscriptionRowId: int('subscription_row_id').notNull(),
    ranAt: bigint('ran_at', { mode: 'number' }).notNull(),
    tradesCreated: int('trades_created').notNull().default(0),
    detailJson: text('detail_json'),
  },
  (t) => [index('btr_user_idx').on(t.userId), index('btr_sub_idx').on(t.subscriptionRowId)]
)

export const liveOrders = mysqlTable(
  'live_orders',
  {
    id: varchar('id', { length: 36 }).primaryKey(),
    userId: int('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    pair: varchar('pair', { length: 32 }).notNull(),
    side: mysqlEnum('side', ['buy', 'sell']).notNull(),
    orderType: mysqlEnum('order_type', ['market', 'limit', 'stop']).notNull(),
    amount: decimal('amount', { precision: 24, scale: 8 }).notNull(),
    leverage: int('leverage').notNull(),
    price: decimal('price', { precision: 24, scale: 8 }),
    marginType: mysqlEnum('margin_type', ['isolated', 'cross']).notNull(),
    status: mysqlEnum('status', ['open', 'filled', 'cancelled']).notNull().default('open'),
    createdAt: bigint('created_at', { mode: 'number' }).notNull(),
  },
  (t) => [index('lo_user_idx').on(t.userId), index('lo_pair_idx').on(t.pair)]
)

export const usersRelations = relations(users, ({ many }) => ({
  sessions: many(sessions),
  trades: many(trades),
}))
