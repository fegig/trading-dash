import { createApp } from './app'
export { LiveTradingRoom } from './durable/LiveTradingRoom'
import type { Env } from './types/env'
import { createDbContext, releaseDbContext } from './db/client'
import { runBotCycle } from './services/bot-engine'
import { sweepLiveDeskTpsl } from './services/live-trading-cron'
import { deleteExpiredDepositIntents } from './services/wallet-pending-cleanup'

const app = createApp()

export default {
  fetch: app.fetch.bind(app),
  /** Wrangler `triggers.crons` (e.g. every 15m); bot trades still respect per-bot cadence + daily caps. */
  async scheduled(_event: ScheduledEvent, env: Env, ctx: ExecutionContext) {
    ctx.waitUntil(
      (async () => {
        await runBotCycle(env)
        await sweepLiveDeskTpsl(env)
        const dbCtx = await createDbContext(env.HYPERDRIVE.connectionString)
        try {
          await deleteExpiredDepositIntents(dbCtx.db)
        } finally {
          await releaseDbContext(dbCtx)
        }
      })()
    )
  },
}
