import 'dotenv'
import { defineConfig } from 'drizzle-kit'

function dbCredentials():
  | { url: string }
  | { host: string; port: number; user: string; password: string; database: string } {
  const host = process.env.MYSQL_HOST
  const user = process.env.MYSQL_USER
  const password = process.env.MYSQL_PASSWORD
  const database = process.env.MYSQL_DATABASE
  const port = Number(process.env.MYSQL_PORT || '3306')

  if (host && user !== undefined && password !== undefined && database) {
    return { host, port, user, password, database }
  }

  const url = process.env.DATABASE_URL
  if (!url) {
    throw new Error(
      'drizzle-kit migrate: set MYSQL_HOST, MYSQL_USER, MYSQL_PASSWORD, MYSQL_DATABASE (optional MYSQL_PORT), ' +
        'or a DATABASE_URL whose password is URL-encoded if it contains ? & # @'
    )
  }
  return { url }
}

export default defineConfig({
  schema: './src/db/schema.ts',
  out: './src/db/migrations',
  dialect: 'mysql',
  dbCredentials: dbCredentials(),
})
