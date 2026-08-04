"use server"

import { db } from "@/lib/db"
import {
  inventoryItems,
  inventoryMovements,
  services,
  vehicles,
} from "@/lib/db/schema"
import { desc, eq, sql } from "drizzle-orm"

export type DashboardData = {
  fleet: { total: number; active: number }
  inventory: { skus: number; totalValue: number; lowStock: number }
  services: { count: number; totalCost: number }
  costByMonth: { month: string; total: number }[]
  stockMix: { category: string; value: number }[]
  reposition: { id: number; name: string; quantity: number; minQuantity: number }[]
  lastServices: {
    id: number
    vehiclePlate: string | null
    serviceType: string
    cost: string
    serviceDate: Date
  }[]
}

const MONTHS = ["JAN", "FEV", "MAR", "ABR", "MAI", "JUN", "JUL", "AGO", "SET", "OUT", "NOV", "DEZ"]

export async function getDashboardData(): Promise<DashboardData> {
  const [
    fleetRows,
    inventoryRows,
    servicesRows,
    costRows,
    mixRows,
    repositionRows,
    lastServiceRows,
  ] = await Promise.all([
    db
      .select({
        total: sql<number>`count(*)::int`,
        active: sql<number>`count(*) filter (where ${vehicles.status} = 'ativo')::int`,
      })
      .from(vehicles),
    db
      .select({
        skus: sql<number>`count(*)::int`,
        totalValue: sql<number>`coalesce(sum(${inventoryItems.quantity} * ${inventoryItems.unitPrice}), 0)::float`,
        lowStock: sql<number>`count(*) filter (where ${inventoryItems.quantity} <= ${inventoryItems.minQuantity})::int`,
      })
      .from(inventoryItems),
    db
      .select({
        count: sql<number>`count(*)::int`,
        totalCost: sql<number>`coalesce(sum(${services.cost}), 0)::float`,
      })
      .from(services),
    db
      .select({
        month: sql<string>`to_char(${services.serviceDate}, 'YYYY-MM')`,
        total: sql<number>`coalesce(sum(${services.cost}), 0)::float`,
      })
      .from(services)
      .where(sql`${services.serviceDate} >= now() - interval '6 months'`)
      .groupBy(sql`to_char(${services.serviceDate}, 'YYYY-MM')`),
    db
      .select({
        category: sql<string>`coalesce(${inventoryItems.category}, 'Sem categoria')`,
        value: sql<number>`coalesce(sum(${inventoryItems.quantity} * ${inventoryItems.unitPrice}), 0)::float`,
      })
      .from(inventoryItems)
      .groupBy(inventoryItems.category),
    db
      .select({
        id: inventoryItems.id,
        name: inventoryItems.name,
        quantity: inventoryItems.quantity,
        minQuantity: inventoryItems.minQuantity,
      })
      .from(inventoryItems)
      .where(sql`${inventoryItems.quantity} <= ${inventoryItems.minQuantity}`)
      .limit(8),
    db
      .select({
        id: services.id,
        vehiclePlate: services.vehiclePlate,
        serviceType: services.serviceType,
        cost: services.cost,
        serviceDate: services.serviceDate,
      })
      .from(services)
      .orderBy(desc(services.serviceDate))
      .limit(5),
  ])

  // Monta os últimos 6 meses
  const now = new Date()
  const costByMonth: { month: string; total: number }[] = []
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`
    const match = costRows.find((c) => c.month === key)
    costByMonth.push({ month: MONTHS[d.getMonth()], total: match ? match.total : 0 })
  }

  return {
    fleet: fleetRows[0],
    inventory: inventoryRows[0],
    services: servicesRows[0],
    costByMonth,
    stockMix: mixRows.filter((m) => m.value > 0).sort((a, b) => b.value - a.value),
    reposition: repositionRows,
    lastServices: lastServiceRows,
  }
}
