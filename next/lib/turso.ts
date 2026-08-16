import { inventoriesTable as invs } from '@dash/vod/db/schema'
import { createClient, type InStatement } from '@libsql/client/web'
import { drizzle } from 'drizzle-orm/libsql/web'

export { invs }

export interface IndexRow {
  inventory_path: string
  date: string
}

export type InventoryRecord = typeof invs.$inferSelect

const turso = createClient({
  url: process.env.TURSO_DATABASE_URL,
  authToken: process.env.TURSO_AUTH_TOKEN,
})

export const db = drizzle({ client: turso })

export const dbQuery = async <T = IndexRow>(sql: InStatement) => {
  const result = await turso.execute(sql)
  return result.rows as unknown as T[]
}
