"use server"

import { db } from "@/lib/db"
import { inventoryItems, inventoryMovements } from "@/lib/db/schema"
import { and, desc, eq, ilike, or, sql } from "drizzle-orm"
import { revalidatePath } from "next/cache"

export type ItemInput = {
  name: string
  reference?: string
  category?: string
  manufacturer?: string
  quantity?: number
  minQuantity?: number
  unitPrice?: number
  location?: string
}

export async function getItems(search?: string) {
  if (search && search.trim()) {
    const term = `%${search.trim()}%`
    return db
      .select()
      .from(inventoryItems)
      .where(
        or(
          ilike(inventoryItems.name, term),
          ilike(inventoryItems.reference, term),
          ilike(inventoryItems.category, term),
          ilike(inventoryItems.manufacturer, term),
          ilike(inventoryItems.location, term),
        ),
      )
      .orderBy(desc(inventoryItems.createdAt))
  }
  return db
    .select()
    .from(inventoryItems)
    .orderBy(desc(inventoryItems.createdAt))
}

export async function getStats() {
  const [totals] = await db
    .select({
      totalItems: sql<number>`count(*)::int`,
      totalUnits: sql<number>`coalesce(sum(${inventoryItems.quantity}), 0)::int`,
      totalValue: sql<number>`coalesce(sum(${inventoryItems.quantity} * ${inventoryItems.unitPrice}), 0)::float`,
      lowStock: sql<number>`count(*) filter (where ${inventoryItems.quantity} <= ${inventoryItems.minQuantity})::int`,
    })
    .from(inventoryItems)
  return totals
}

export async function bulkImportItems(rows: ItemInput[]) {
  const valid = rows.filter((r) => r.name && r.name.trim())
  if (valid.length === 0) throw new Error("Nenhum item válido para importar")

  await db.insert(inventoryItems).values(
    valid.map((input) => ({
      name: input.name.trim(),
      reference: input.reference?.trim() || null,
      category: input.category?.trim() || null,
      manufacturer: input.manufacturer?.trim() || null,
      quantity: input.quantity ?? 0,
      minQuantity: input.minQuantity ?? 0,
      unitPrice: String(input.unitPrice ?? 0),
      location: input.location?.trim() || null,
    })),
  )

  revalidatePath("/")
  return valid.length
}

export async function createItem(input: ItemInput) {
  await db.insert(inventoryItems).values({
    name: input.name,
    reference: input.reference || null,
    category: input.category || null,
    manufacturer: input.manufacturer || null,
    quantity: input.quantity ?? 0,
    minQuantity: input.minQuantity ?? 0,
    unitPrice: String(input.unitPrice ?? 0),
    location: input.location || null,
  })
  revalidatePath("/")
}

export async function updateItem(id: number, input: ItemInput) {
  await db
    .update(inventoryItems)
    .set({
      name: input.name,
      reference: input.reference || null,
      category: input.category || null,
      manufacturer: input.manufacturer || null,
      quantity: input.quantity ?? 0,
      minQuantity: input.minQuantity ?? 0,
      unitPrice: String(input.unitPrice ?? 0),
      location: input.location || null,
      updatedAt: new Date(),
    })
    .where(eq(inventoryItems.id, id))
  revalidatePath("/")
}

export async function deleteItem(id: number) {
  await db
    .delete(inventoryMovements)
    .where(eq(inventoryMovements.itemId, id))
  await db.delete(inventoryItems).where(eq(inventoryItems.id, id))
  revalidatePath("/")
}

export async function registerMovement(
  itemId: number,
  type: "entrada" | "saida",
  quantity: number,
  note?: string,
) {
  if (quantity <= 0) throw new Error("Quantidade deve ser maior que zero")

  const [item] = await db
    .select()
    .from(inventoryItems)
    .where(eq(inventoryItems.id, itemId))

  if (!item) throw new Error("Item não encontrado")

  const newQuantity =
    type === "entrada" ? item.quantity + quantity : item.quantity - quantity

  if (newQuantity < 0) {
    throw new Error("Estoque insuficiente para esta saída")
  }

  await db.insert(inventoryMovements).values({
    itemId,
    type,
    quantity,
    note: note || null,
  })

  await db
    .update(inventoryItems)
    .set({ quantity: newQuantity, updatedAt: new Date() })
    .where(eq(inventoryItems.id, itemId))

  revalidatePath("/")
}

export async function getMovements(itemId?: number) {
  const base = db
    .select({
      id: inventoryMovements.id,
      itemId: inventoryMovements.itemId,
      type: inventoryMovements.type,
      quantity: inventoryMovements.quantity,
      note: inventoryMovements.note,
      createdAt: inventoryMovements.createdAt,
      itemName: inventoryItems.name,
    })
    .from(inventoryMovements)
    .leftJoin(
      inventoryItems,
      eq(inventoryMovements.itemId, inventoryItems.id),
    )
    .orderBy(desc(inventoryMovements.createdAt))
    .limit(50)

  if (itemId) {
    return base.where(eq(inventoryMovements.itemId, itemId))
  }
  return base
}
