import { createApp } from './app'
export { LiveTradingRoom } from './durable/LiveTradingRoom'
import type { Env } from './types/env'
import { runBotCycle } from './services/bot-engine'

const app = createApp()

export default {
  fetch: app.fetch.bind(app),
  async scheduled(_event: ScheduledEvent, env: Env, ctx: ExecutionContext) {
    ctx.waitUntil(runBotCycle(env))
  },
}
