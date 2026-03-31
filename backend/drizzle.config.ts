import { env } from 'cloudflare:workers'
import { defineConfig, type Config } from 'drizzle-kit'


export default defineConfig({
  schema: './src/db/schema.ts',
  out: './src/db/migrations',
  dialect: 'mysql',
  dbCredentials: {
    url: env.HYPERDRIVE?.connectionString ?? 'mysql://root:What,man@123@localhost:3306/trading_dash_offline_db',
  },
}) satisfies Config
