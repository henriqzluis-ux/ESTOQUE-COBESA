"use server"

import { db } from "@/lib/db"
import {
  conferences,
  conferenceItems,
  inventoryItems,
} from "@/lib/db/schema"
import { asc, desc, eq } from "drizzle-orm"
import { revalidatePath } from "next/cache"

export async function getConferences() {
  return db.select().from(conferences).orderBy(desc(conferences.createdAt))
}

export async function getOpenConference() {
  const [open] = await db
    .select()
    .from(conferences)
    .where(eq(conferences.status, "aberta"))
    .orderBy(desc(conferences.createdAt))
    .limit(1)
  return open ?? null
}

export async function getConferenceItems(conferenceId: number) {
  return db
    .select()
    .from(conferenceItems)
    .where(eq(conferenceItems.conferenceId, conferenceId))
    .orderBy(asc(conferenceItems.itemName))
}

export async function startConference() {
  const items = await db.select().from(inventoryItems)
  if (items.length === 0) throw new Error("Nenhum item no estoque para conferir")

  const [conf] = await db
    .insert(conferences)
    .values({ status: "aberta" })
    .returning()

  await db.insert(conferenceItems).values(
    items.map((item) => ({
      conferenceId: conf.id,
      itemId: item.id,
      itemName: item.name,
      systemQuantity: item.quantity,
      physicalQuantity: null,
    })),
  )

  revalidatePath("/")
  return conf
}

export async function updatePhysicalQuantity(
  conferenceItemId: number,
  physicalQuantity: number | null,
) {
  await db
    .update(conferenceItems)
    .set({ physicalQuantity })
    .where(eq(conferenceItems.id, conferenceItemId))
}

export async function finishConference(
  conferenceId: number,
  adjustStock: boolean,
) {
  const items = await db
    .select()
    .from(conferenceItems)
    .where(eq(conferenceItems.conferenceId, conferenceId))

  let divergences = 0
  for (const ci of items) {
    if (ci.physicalQuantity !== null && ci.physicalQuantity !== ci.systemQuantity) {
      divergences++
      if (adjustStock) {
        await db
          .update(inventoryItems)
          .set({ quantity: ci.physicalQuantity, updatedAt: new Date() })
          .where(eq(inventoryItems.id, ci.itemId))
      }
    }
  }

  await db
    .update(conferences)
    .set({
      status: "finalizada",
      divergences,
      finishedAt: new Date(),
    })
    .where(eq(conferences.id, conferenceId))

  revalidatePath("/")
  return divergences
}

export async function cancelConference(conferenceId: number) {
  await db.delete(conferenceItems).where(eq(conferenceItems.conferenceId, conferenceId))
  await db.delete(conferences).where(eq(conferences.id, conferenceId))
  revalidatePath("/")
}
