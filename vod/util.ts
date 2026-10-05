import { and, like, lte } from 'drizzle-orm'
import { db } from './db'
import { inventoriesTable as inv } from './db/schema'

// utilities for cleaning up database entries past a certain age. (R2 is cheap, but I
// generate about a terabyte per month, so I can't afford to keep all of it.)
// must be paired with `rclone` to actually delete the files from R2:
//
// # delete all `wyze1` content from August:
// rclone_v delete r2:vod/2026-08 --include '/*/wyze1*/**'
//
// # delete all `quad` content from September except from the 3rd to the 6th:
// rclone_v delete r2:vod/2026-09/ \
//   --filter "- /0[3-6]/**" \
//   --filter "+ /*/quad/**" \
//   --filter "- *"

async function selectThrough(date: string, pattern: string) {
  if (!pattern) {
    throw new Error('pattern expected')
  }
  return await db
    .select()
    .from(inv)
    .where(and(lte(inv.date, date), like(inv.inventoryPath, pattern)))
}

async function deleteThrough(date: string, pattern: string) {
  if (!pattern) {
    throw new Error('pattern expected')
  }
  return await db
    .delete(inv)
    .where(and(lte(inv.date, date), like(inv.inventoryPath, pattern)))
}

export { selectThrough, deleteThrough }
