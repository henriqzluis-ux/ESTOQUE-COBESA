"use server"

import { db } from "@/lib/db"
import { vehicles } from "@/lib/db/schema"
import { desc, eq, ilike, or, sql } from "drizzle-orm"
import { revalidatePath } from "next/cache"

export type VehicleInput = {
  plate: string
  model: string
  brand?: string
  type?: string
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
          ilike(vehicles.status, term),
        ),
      )
      .orderBy(desc(vehicles.createdAt))
  }
  return db.select().from(vehicles).orderBy(desc(vehicles.createdAt))
}

export async function getFleetStats() {
  const [totals] = await db
    .select({
      totalVehicles: sql<number>`count(*)::int`,
      active: sql<number>`count(*) filter (where ${vehicles.status} = 'Ativo')::int`,
      maintenance: sql<number>`count(*) filter (where ${vehicles.status} = 'Manutenção')::int`,
      totalKm: sql<number>`coalesce(sum(${vehicles.currentKm}), 0)::int`,
    })
    .from(vehicles)
  return totals
}

export async function createVehicle(input: VehicleInput) {
  const km = input.currentKm ?? 0
  await db.insert(vehicles).values({
    plate: input.plate.trim().toUpperCase(),
    model: input.model.trim(),
    brand: input.brand?.trim() || null,
    type: input.type || "Caminhão",
    currentKm: km,
    initialKm: km,
    status: input.status || "Ativo",
  })
  revalidatePath("/")
}

export async function updateVehicle(id: number, input: VehicleInput) {
  await db
    .update(vehicles)
    .set({
      plate: input.plate.trim().toUpperCase(),
      model: input.model.trim(),
      brand: input.brand?.trim() || null,
      type: input.type || "Caminhão",
      currentKm: input.currentKm ?? 0,
      status: input.status || "Ativo",
      updatedAt: new Date(),
    })
    .where(eq(vehicles.id, id))
  revalidatePath("/")
}

export async function deleteVehicle(id: number) {
  await db.delete(vehicles).where(eq(vehicles.id, id))
  revalidatePath("/")
}
