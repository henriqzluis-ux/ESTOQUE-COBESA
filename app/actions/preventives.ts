"use server"

import { db } from "@/lib/db"
import { preventives, vehicles } from "@/lib/db/schema"
import { desc, eq } from "drizzle-orm"
import { revalidatePath } from "next/cache"
import { computeStatus } from "@/lib/preventive-status"

export type PreventiveInput = {
  vehicleId: number
  description: string
  intervalKm?: number
  lastKm?: number
}

export async function getPreventives() {
  const rows = await db
    .select({
      id: preventives.id,
      vehicleId: preventives.vehicleId,
      vehiclePlate: preventives.vehiclePlate,
      description: preventives.description,
      intervalKm: preventives.intervalKm,
      lastKm: preventives.lastKm,
      nextKm: preventives.nextKm,
      status: preventives.status,
      createdAt: preventives.createdAt,
      currentKm: vehicles.currentKm,
    })
    .from(preventives)
    .leftJoin(vehicles, eq(preventives.vehicleId, vehicles.id))
    .orderBy(desc(preventives.createdAt))

  // Recalcula status com base nos km rodados desde a última preventiva
  return rows.map((r) => {
    const currentKm = r.currentKm ?? r.lastKm
    return {
      ...r,
      currentKm,
      kmRodados: Math.max(0, currentKm - r.lastKm),
      status: computeStatus(r.lastKm, currentKm),
    }
  })
}

export async function createPreventive(input: PreventiveInput) {
  const [vehicle] = await db
    .select()
    .from(vehicles)
    .where(eq(vehicles.id, input.vehicleId))

  if (!vehicle) throw new Error("Veículo não encontrado")

  const lastKm = input.lastKm ?? vehicle.currentKm
  const interval = input.intervalKm ?? 0
  const nextKm = lastKm + interval

  await db.insert(preventives).values({
    vehicleId: input.vehicleId,
    vehiclePlate: vehicle.plate,
    description: input.description,
    intervalKm: interval,
    lastKm,
    nextKm,
    status: computeStatus(lastKm, vehicle.currentKm),
  })
  revalidatePath("/")
}

export async function markPreventiveDone(id: number) {
  const [p] = await db.select().from(preventives).where(eq(preventives.id, id))
  if (!p) return
  const [vehicle] = await db
    .select()
    .from(vehicles)
    .where(eq(vehicles.id, p.vehicleId))
  const currentKm = vehicle?.currentKm ?? p.nextKm
  const nextKm = currentKm + p.intervalKm
  await db
    .update(preventives)
    .set({
      lastKm: currentKm,
      nextKm,
      status: computeStatus(currentKm, currentKm),
    })
    .where(eq(preventives.id, id))
  revalidatePath("/")
}

export async function deletePreventive(id: number) {
  await db.delete(preventives).where(eq(preventives.id, id))
  revalidatePath("/")
}
