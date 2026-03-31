import { eq } from 'drizzle-orm'
import type { MySql2Database } from 'drizzle-orm/mysql2/driver'
import * as schema from '../db/schema'

export async function getInternalUserIdByPublicId(
  db: MySql2Database<typeof schema>,
  publicId: string
): Promise<number | null> {
  const row = await db
    .select({ id: schema.users.id })
    .from(schema.users)
    .where(eq(schema.users.publicId, publicId))
    .limit(1)
  return row[0]?.id ?? null
}
