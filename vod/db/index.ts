import { createClient } from '@libsql/client'
import { drizzle } from 'drizzle-orm/libsql'
import { inventoriesTable, vodIndex } from './schema'

const turso = createClient({
  url: process.env.TURSO_DATABASE_URL,
  authToken: process.env.TURSO_AUTH_TOKEN,
})

export const db = drizzle({ client: turso })

export async function fromTest() {
  const rows = await db.select().from(vodIndex)
  const result = await db.insert(inventoriesTable).values(
    rows.map(({ inventory_path, date }) => ({
      inventoryPath: inventory_path,
      date,
    })),
  )

  return db.select().from(inventoriesTable)
}

export async function initDb() {
  turso.execute(`
    CREATE TABLE vod_index (
      inventory_path TEXT UNIQUE NOT NULL,
      date TEXT NOT NULL
    )
  `)
}

export async function indexInventory(path: string, date: string) {
  // avoid libsql errors by telling the db to ignore the insert if there's an existing
  // row with inventory_path
  const res = await turso.execute(
    `INSERT INTO vod_index (inventory_path, date)
     VALUES (?, ?)
     ON CONFLICT(inventory_path) DO NOTHING`,
    [path, date],
  )

  // console.log(res)
}

export async function queryInventory() {
  const res = await turso.execute(
    `SELECT inventory_path, date FROM vod_index WHERE date > '2026-08-01'`,
  )

  console.log(res)
}
