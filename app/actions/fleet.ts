"use server"

import { db } from "@/lib/db"
import { vehicles, services, preventives } from "@/lib/db/schema"
import { desc, eq, ilike, or } from "drizzle-orm"
import { revalidatePath } from "next/cache"

export type VehicleInput = {
  plate: string
  model?: string
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
        ),
      )
      .orderBy(desc(vehicles.createdAt))
  }
  return db.select().from(vehicles).orderBy(desc(vehicles.createdAt))
}

export async function createVehicle(input: VehicleInput) {
  await db.insert(vehicles).values({
    plate: input.plate.toUpperCase(),
    model: input.model || null,
    brand: input.brand || null,
    type: input.type || null,
    currentKm: input.currentKm ?? 0,
    status: input.status || "ativo",
  })
  revalidatePath("/")
}

export async function updateVehicle(id: number, input: VehicleInput) {
  await db
    .update(vehicles)
    .set({
      plate: input.plate.toUpperCase(),
      model: input.model || null,
      brand: input.brand || null,
      type: input.type || null,
      currentKm: input.currentKm ?? 0,
      status: input.status || "ativo",
      updatedAt: new Date(),
    })
    .where(eq(vehicles.id, id))
  revalidatePath("/")
}

export async function deleteVehicle(id: number) {
  await db.delete(preventives).where(eq(preventives.vehicleId, id))
  await db.delete(services).where(eq(services.vehicleId, id))
  await db.delete(vehicles).where(eq(vehicles.id, id))
  revalidatePath("/")
}
