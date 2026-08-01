"use server"

import { db } from "@/lib/db"
import {
  inventoryItems,
  inventoryMovements,
  vehicles,
} from "@/lib/db/schema"
import { and, desc, eq, isNotNull, sql } from "drizzle-orm"

// Lista de veículos que possuem pelo menos uma retirada de estoque associada,
// junto com totais para exibir no filtro.
export async function getVehiclesWithWithdrawals() {
  return db
    .select({
      vehicleId: inventoryMovements.vehicleId,
      vehiclePlate: inventoryMovements.vehiclePlate,
      totalMovements: sql<number>`count(*)::int`,
      totalUnits: sql<number>`coalesce(sum(${inventoryMovements.quantity}), 0)::int`,
    })
    .from(inventoryMovements)
    .where(
      and(
        eq(inventoryMovements.type, "saida"),
        isNotNull(inventoryMovements.vehicleId),
      ),
    )
    .groupBy(inventoryMovements.vehicleId, inventoryMovements.vehiclePlate)
}

// Retorna todas as retiradas (saídas) de estoque para um veículo específico.
export async function getWithdrawalsByVehicle(vehicleId: number) {
  return db
    .select({
      id: inventoryMovements.id,
      itemId: inventoryMovements.itemId,
      itemName: inventoryItems.name,
      itemReference: inventoryItems.reference,
      quantity: inventoryMovements.quantity,
      unitPrice: inventoryItems.unitPrice,
      note: inventoryMovements.note,
      createdAt: inventoryMovements.createdAt,
    })
    .from(inventoryMovements)
    .leftJoin(inventoryItems, eq(inventoryMovements.itemId, inventoryItems.id))
    .where(
      and(
        eq(inventoryMovements.type, "saida"),
        eq(inventoryMovements.vehicleId, vehicleId),
      ),
    )
    .orderBy(desc(inventoryMovements.createdAt))
}

// Lista de veículos ativos para popular o seletor.
export async function getActiveVehicles() {
  return db
    .select({
      id: vehicles.id,
      plate: vehicles.plate,
      model: vehicles.model,
      brand: vehicles.brand,
    })
    .from(vehicles)
    .orderBy(vehicles.plate)
}
