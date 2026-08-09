import { createClient, type InStatement } from '@libsql/client/web'

export interface IndexRow {
  inventory_path: string
  date: string
}

export const turso = createClient({
  url: process.env.TURSO_DATABASE_URL,
  authToken: process.env.TURSO_AUTH_TOKEN,
})

export const dbQuery = async <T = IndexRow>(sql: InStatement) => {
  const result = await turso.execute(sql)
  return result.rows as unknown as T[]
}
