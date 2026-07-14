import {
  integer,
  numeric,
  pgTable,
  serial,
  text,
  timestamp,
} from "drizzle-orm/pg-core"

export const inventoryItems = pgTable("inventory_items", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  reference: text("reference"),
  category: text("category"),
  manufacturer: text("manufacturer"),
  quantity: integer("quantity").notNull().default(0),
  minQuantity: integer("min_quantity").notNull().default(0),
  unitPrice: numeric("unit_price", { precision: 12, scale: 2 })
    .notNull()
    .default("0"),
  location: text("location"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
})

export const inventoryMovements = pgTable("inventory_movements", {
  id: serial("id").primaryKey(),
  itemId: integer("item_id").notNull(),
  type: text("type").notNull(), // 'entrada' | 'saida'
  quantity: integer("quantity").notNull(),
  note: text("note"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
})

export const vehicles = pgTable("vehicles", {
  id: serial("id").primaryKey(),
  plate: text("plate").notNull(),
  type: text("type").notNull().default("Caminhão"), // 'Caminhão' | 'Carreta'
  model: text("model").notNull(),
  brand: text("brand"),
  initialKm: integer("initial_km").notNull().default(0),
  currentKm: integer("current_km").notNull().default(0),
  status: text("status").notNull().default("operando"), // 'operando' | 'manutencao' | 'inativo'
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
})

export type InventoryItem = typeof inventoryItems.$inferSelect
export type InventoryMovement = typeof inventoryMovements.$inferSelect
export type Vehicle = typeof vehicles.$inferSelect
