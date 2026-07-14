"use server"

import { db } from "@/lib/db"
import { vehicles } from "@/lib/db/schema"
import { desc, eq, ilike, or, sql } from "drizzle-orm"
import { revalidatePath } from "next/cache"

export type VehicleInput = {
  plate: string
  type?: string
  model: string
  brand?: string
  initialKm?: number
  currentKm?: number
  status?: string
}

export async function getVehicles(search?: string) {
  if (search && search.trim()) {
    const term = `%${search.trim()}%`
    return db
      .select()
      .from(vehicles)
      .where(
        or(
          ilike(vehicles.plate, term),
          ilike(vehicles.model, term),
          ilike(vehicles.brand, term),
          ilike(vehicles.type, term),
        ),
      )
      .orderBy(desc(vehicles.createdAt))
  }
  return db.select().from(vehicles).orderBy(desc(vehicles.createdAt))
}

export async function getFleetStats() {
  const [totals] = await db
    .select({
      total: sql<number>`count(*)::int`,
      operating: sql<number>`count(*) filter (where ${vehicles.status} = 'operando')::int`,
      maintenance: sql<number>`count(*) filter (where ${vehicles.status} = 'manutencao')::int`,
      inactive: sql<number>`count(*) filter (where ${vehicles.status} = 'inativo')::int`,
    })
    .from(vehicles)
  return totals
}

export async function createVehicle(input: VehicleInput) {
  const initial = input.initialKm ?? 0
  await db.insert(vehicles).values({
    plate: input.plate.toUpperCase(),
    type: input.type || "Caminhão",
    model: input.model,
    brand: input.brand || null,
    initialKm: initial,
    currentKm: input.currentKm ?? initial,
    status: input.status || "operando",
  })
  revalidatePath("/frota")
}

export async function updateVehicle(id: number, input: VehicleInput) {
  const initial = input.initialKm ?? 0
  await db
    .update(vehicles)
    .set({
      plate: input.plate.toUpperCase(),
      type: input.type || "Caminhão",
      model: input.model,
      brand: input.brand || null,
      initialKm: initial,
      currentKm: input.currentKm ?? initial,
      status: input.status || "operando",
      updatedAt: new Date(),
    })
    .where(eq(vehicles.id, id))
  revalidatePath("/frota")
}

export async function updateVehicleStatus(id: number, status: string) {
  await db
    .update(vehicles)
    .set({ status, updatedAt: new Date() })
    .where(eq(vehicles.id, id))
  revalidatePath("/frota")
}

export async function deleteVehicle(id: number) {
  await db.delete(vehicles).where(eq(vehicles.id, id))
  revalidatePath("/frota")
}
