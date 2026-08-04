"use server"

import { db } from "@/lib/db"
import { services, vehicles } from "@/lib/db/schema"
import { desc, eq, ilike, or, sql } from "drizzle-orm"
import { revalidatePath } from "next/cache"

export type ServiceInput = {
  vehicleId?: number | null
  vehiclePlate?: string
  serviceType: string
  description?: string
  km?: number
  cost?: number
  provider?: string
  serviceDate?: string
}

export async function getServices(search?: string) {
  if (search && search.trim()) {
    const term = `%${search.trim()}%`
    return db
      .select()
      .from(services)
      .where(
        or(
          ilike(services.vehiclePlate, term),
          ilike(services.serviceType, term),
          ilike(services.description, term),
          ilike(services.provider, term),
        ),
      )
      .orderBy(desc(services.serviceDate))
  }
  return db.select().from(services).orderBy(desc(services.serviceDate))
}

export async function createService(input: ServiceInput) {
  await db.insert(services).values({
    vehicleId: input.vehicleId ?? null,
    vehiclePlate: input.vehiclePlate || null,
    serviceType: input.serviceType,
    description: input.description || null,
    km: input.km ?? 0,
    cost: String(input.cost ?? 0),
    provider: input.provider || null,
    serviceDate: input.serviceDate ? new Date(input.serviceDate) : new Date(),
  })

  // Atualiza o KM do veículo se o serviço tiver KM maior
  if (input.vehicleId && input.km && input.km > 0) {
    await db
      .update(vehicles)
      .set({ currentKm: input.km, updatedAt: new Date() })
      .where(eq(vehicles.id, input.vehicleId))
  }

  revalidatePath("/")
}

export async function deleteService(id: number) {
  await db.delete(services).where(eq(services.id, id))
  revalidatePath("/")
}

export async function getServiceStats() {
  const [totals] = await db
    .select({
      count: sql<number>`count(*)::int`,
      totalCost: sql<number>`coalesce(sum(${services.cost}), 0)::float`,
    })
    .from(services)
  return totals
}
