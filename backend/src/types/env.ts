import type { Connection } from 'mysql2/promise'
import type { MySql2Database } from 'drizzle-orm/mysql2/driver'
import type * as schema from '../db/schema'
import type { SessionUser } from '../services/user-context'

export type Env = {
  HYPERDRIVE: Hyperdrive
  VERIFICATION_UPLOADS: R2Bucket
  /** Site logos and marketing assets (public GET via Worker). */
  SITE_ASSETS: R2Bucket
  RATE_LIMIT?: KVNamespace
  /** Optional KV for CryptoCompare response caching (create via `wrangler kv namespace create`) */
  CRYPTO_CACHE?: KVNamespace
  LIVE_TRADING: DurableObjectNamespace
  RESEND_API_KEY: string
  SESSION_SECRET: string
  API_KEY?: string
  /** Server-only; set in .dev.vars / Workers secrets */
  CRYPTOCOMPARE_API_KEY?: string
  /** Optional second CryptoCompare key — used as automatic fallback when the primary key is rate-limited or returns an error. */
  CRYPTOCOMPARE_API_KEY_2?: string
  /**
   * Max outbound CryptoCompare HTTP calls per UTC minute (KV counter, default 150).
   * Set lower in staging or raise if you have a paid CC plan.
   */
  CRYPTOCOMPARE_MAX_REQ_PER_MINUTE?: string | number
  /** Finnhub free API key — covers stocks, ETFs, forex, commodities (60 req/min). Sign up at finnhub.io */
  FINNHUB_API_KEY?: string
  SESSION_COOKIE_NAME: string
  CORS_ORIGIN: string
  RESEND_FROM: string
  /** Public dashboard URL for email links and footer “visit site” */
  FRONTEND_URL?: string
  /** Optional absolute URL to logo image for transactional emails (overrides DB logo when set) */
  EMAIL_LOGO_URL?: string
  /**
   * Public HTTPS origin of **this API Worker** (e.g. https://api.example.com).
   * Required for email `<img src=".../public/branding/email-logo">` to resolve — do not use the SPA host.
   */
  BRANDING_PUBLIC_URL?: string
  /** Alias for BRANDING_PUBLIC_URL (email / crawler asset URLs). */
  API_PUBLIC_URL?: string
}

export type AppVariables = {
  db: MySql2Database<typeof schema>
  dbConn: Connection
  user: SessionUser | null
}
