"use server"

import { generateText } from "ai"
import { desc } from "drizzle-orm"
import { db } from "@/lib/db"
import {
  inventoryItems,
  preventives,
  services,
  vehicles,
} from "@/lib/db/schema"

async function collectSnapshot() {
  const [items, vehicleList, preventiveList, recentServices] = await Promise.all([
    db.select().from(inventoryItems),
    db.select().from(vehicles),
    db.select().from(preventives),
    db.select().from(services).orderBy(desc(services.serviceDate)).limit(30),
  ])

  const lowStock = items.filter((i) => i.quantity <= i.minQuantity)
  const stockValue = items.reduce(
    (acc, i) => acc + Number(i.unitPrice) * i.quantity,
    0,
  )
  const overdue = preventiveList.filter((p) => p.status === "vencido")
  const upcoming = preventiveList.filter((p) => p.status === "proximo")
  const serviceCost = recentServices.reduce((acc, s) => acc + Number(s.cost), 0)

  return {
    stock: {
      totalItems: items.length,
      totalValue: stockValue,
      lowStock: lowStock.map((i) => ({
        nome: i.name,
        atual: i.quantity,
        minimo: i.minQuantity,
      })),
    },
    fleet: {
      total: vehicleList.length,
      emManutencao: vehicleList.filter((v) => v.status === "manutencao").length,
    },
    preventives: {
      vencidas: overdue.map((p) => ({
        veiculo: p.vehiclePlate,
        descricao: p.description,
      })),
      proximas: upcoming.map((p) => ({
        veiculo: p.vehiclePlate,
        descricao: p.description,
      })),
    },
    services: {
      ultimos30: recentServices.length,
      custoTotal: serviceCost,
    },
  }
}

export async function generateAiAnalysis(question?: string) {
  const snapshot = await collectSnapshot()

  const system =
    "Você é um analista de operações e manutenção de frota da COBESA. " +
    "Com base nos dados fornecidos (estoque do almoxarifado, frota, manutenções preventivas e serviços), " +
    "gere uma análise objetiva em português do Brasil. " +
    "Estruture a resposta em seções curtas com títulos em markdown (##): " +
    "Resumo, Pontos de Atenção, Recomendações. " +
    "Seja direto, use bullet points e destaque riscos como estoque crítico e preventivas vencidas."

  const prompt = `Dados atuais da operação (JSON):\n\n${JSON.stringify(
    snapshot,
    null,
    2,
  )}\n\n${
    question
      ? `Pergunta específica do gestor: ${question}`
      : "Faça uma análise geral da operação."
  }`

  try {
    const { text } = await generateText({
      model: "openai/gpt-4o-mini",
      system,
      prompt,
    })
    return { analysis: text, snapshot }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    if (
      message.includes("credit card") ||
      message.includes("customer_verification")
    ) {
      throw new Error(
        "O AI Gateway da Vercel exige um cartão de crédito cadastrado na conta para liberar as análises com IA (inclui créditos gratuitos). Cadastre um cartão em vercel.com/dashboard nas configurações de AI e tente novamente.",
      )
    }
    console.log("[v0] generateAiAnalysis error:", message)
    throw new Error("Não foi possível gerar a análise no momento. Tente novamente.")
  }
}
