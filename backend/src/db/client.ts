import { drizzle, type MySql2Database } from 'drizzle-orm/mysql2/driver'
import { createConnection, type Connection } from 'mysql2/promise'
import * as schema from './schema'

export type DbContext = {
  db: MySql2Database<typeof schema>
  conn: Connection
}

/** mysql2 rejects unknown URL query keys; Hyperdrive/MySQL URLs often include `ssl-mode`. */
function normalizeMysqlConnectionUri(uri: string): string {
  try {
    const u = new URL(uri)
    for (const key of ['ssl-mode', 'sslMode']) {
      u.searchParams.delete(key)
    }
    return u.toString()
  } catch {
    return uri
  }
}

export async function createDbContext(connectionString: string): Promise<DbContext> {
  const uri = normalizeMysqlConnectionUri(connectionString)
  // Workers forbid dynamic code generation; mysql2's default row parsers use `new Function()`.
  const conn = await createConnection({ uri, disableEval: true })
  const db = drizzle(conn, { schema, mode: 'default' })
  return { db, conn }
}

export async function releaseDbContext(ctx: DbContext): Promise<void> {
  await ctx.conn.end()
}
