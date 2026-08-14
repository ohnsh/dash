import { sqliteTable, primaryKey, unique, text, integer } from "drizzle-orm/sqlite-core"
import { sql } from "drizzle-orm"

export const vodIndex = sqliteTable("vod_index", {
	inventoryPath: text("inventory_path").notNull(),
	date: text().notNull(),
},
(table) => [unique("vod_index_inventory_path_unique").on(table.inventoryPath),
]);

export const inventories = sqliteTable("inventories", {
	id: integer().primaryKey({ autoIncrement: true }),
	inventoryPath: text("inventory_path").notNull(),
	date: text().notNull(),
	updatedAt: integer("updated_at").notNull(),
	speechTotal: integer("speech_total").default(0),
},
(table) => [unique("inventories_inventory_path_unique").on(table.inventoryPath),
]);

