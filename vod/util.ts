import { and, like, lte, sql } from 'drizzle-orm'
import { db } from './db'
import { inventoriesTable as inv } from './db/schema'

async function selectThrough(date: string, pattern: string) {
  return await db
    .select()
    .from(inv)
    .where(and(lte(inv.date, date), like(inv.inventoryPath, pattern)))
}

async function deleteThrough(date: string, pattern: string) {
  return await db
    .delete(inv)
    .where(and(lte(inv.date, date), like(inv.inventoryPath, pattern)))
}

export { selectThrough, deleteThrough }
