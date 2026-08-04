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
  vehicleId: integer("vehicle_id"),
  vehiclePlate: text("vehicle_plate"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
})

export const vehicles = pgTable("vehicles", {
  id: serial("id").primaryKey(),
  plate: text("plate").notNull(),
  model: text("model"),
  brand: text("brand"),
  type: text("type"),
  currentKm: integer("current_km").notNull().default(0),
  status: text("status").notNull().default("ativo"), // 'ativo' | 'manutencao' | 'inativo'
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
})

export const services = pgTable("services", {
  id: serial("id").primaryKey(),
  vehicleId: integer("vehicle_id"),
  vehiclePlate: text("vehicle_plate"),
  serviceType: text("service_type").notNull(), // preventiva, corretiva, troca de óleo...
  description: text("description"),
  km: integer("km").notNull().default(0),
  cost: numeric("cost", { precision: 12, scale: 2 }).notNull().default("0"),
  provider: text("provider"),
  serviceDate: timestamp("service_date", { withTimezone: true })
    .notNull()
    .defaultNow(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
})

export const preventives = pgTable("preventives", {
  id: serial("id").primaryKey(),
  vehicleId: integer("vehicle_id").notNull(),
  vehiclePlate: text("vehicle_plate"),
  description: text("description").notNull(),
  intervalKm: integer("interval_km").notNull().default(0),
  lastKm: integer("last_km").notNull().default(0),
  nextKm: integer("next_km").notNull().default(0),
  status: text("status").notNull().default("em_dia"), // 'em_dia' | 'proximo' | 'vencido'
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
})

export const conferences = pgTable("conferences", {
  id: serial("id").primaryKey(),
  status: text("status").notNull().default("aberta"), // 'aberta' | 'finalizada'
  notes: text("notes"),
  divergences: integer("divergences").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  finishedAt: timestamp("finished_at", { withTimezone: true }),
})

export const conferenceItems = pgTable("conference_items", {
  id: serial("id").primaryKey(),
  conferenceId: integer("conference_id").notNull(),
  itemId: integer("item_id").notNull(),
  itemName: text("item_name"),
  systemQuantity: integer("system_quantity").notNull().default(0),
  physicalQuantity: integer("physical_quantity"),
})

export type InventoryItem = typeof inventoryItems.$inferSelect
export type InventoryMovement = typeof inventoryMovements.$inferSelect
export type Vehicle = typeof vehicles.$inferSelect
export type Service = typeof services.$inferSelect
export type Preventive = typeof preventives.$inferSelect
export type Conference = typeof conferences.$inferSelect
export type ConferenceItem = typeof conferenceItems.$inferSelect
