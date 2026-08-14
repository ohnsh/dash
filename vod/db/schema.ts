import * as s from 'drizzle-orm/sqlite-core'

export const inventoriesTable = s.snakeCase.table('inventories', {
  id: s.integer().primaryKey({ autoIncrement: true }),
  inventoryPath: s.text().notNull().unique(),
  date: s.text().notNull(),
  speechTotal: s.integer().default(0),
  updatedAt: s
    .integer({ mode: 'timestamp' })
    .notNull()
    .$defaultFn(() => new Date()),
})

export const vodIndex = s.sqliteTable('vod_index', {
  inventory_path: s.text().notNull().unique(),
  date: s.text().notNull(),
})
