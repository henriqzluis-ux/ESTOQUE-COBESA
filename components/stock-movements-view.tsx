"use client"

import { getStockMovements } from "@/app/actions/inventory"
import { cn } from "@/lib/utils"
import { ArrowDownLeft, ArrowUpRight, Repeat } from "lucide-react"
import { useCallback, useEffect, useState } from "react"
import { PageHeader } from "./page-header"

type Movement = {
  id: number
  itemId: number
  type: string
  quantity: number
  note: string | null
  vehiclePlate: string | null
  createdAt: Date | string
  itemName: string | null
  itemReference: string | null
}

type Filter = "todos" | "entrada" | "saida"

function formatDate(date: Date | string) {
  return new Date(date).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  })
}

function formatTime(date: Date | string) {
  return new Date(date).toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
  })
}

const filters: { key: Filter; label: string }[] = [
  { key: "todos", label: "Todas" },
  { key: "entrada", label: "Entradas" },
  { key: "saida", label: "Saídas" },
]

export function StockMovementsView() {
  const [movements, setMovements] = useState<Movement[]>([])
  const [filter, setFilter] = useState<Filter>("todos")
  const [loading, setLoading] = useState(true)

  const load = useCallback(async (f: Filter) => {
    setLoading(true)
    try {
      const rows = await getStockMovements(f === "todos" ? undefined : f)
      setMovements(rows)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load(filter)
  }, [filter, load])

  const totalEntradas = movements
    .filter((m) => m.type === "entrada")
    .reduce((sum, m) => sum + m.quantity, 0)
  const totalSaidas = movements
    .filter((m) => m.type === "saida")
    .reduce((sum, m) => sum + m.quantity, 0)

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Movimentação no Estoque"
        description="Tudo que entra e sai do estoque, com data, hora e quantidade"
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="flex items-center gap-3 rounded-xl border border-border bg-card p-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <ArrowDownLeft className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Unidades que entraram</p>
            <p className="text-xl font-bold text-foreground">{totalEntradas}</p>
          </div>
        </div>
        <div className="flex items-center gap-3 rounded-xl border border-border bg-card p-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-destructive/10 text-destructive">
            <ArrowUpRight className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Unidades que saíram</p>
            <p className="text-xl font-bold text-foreground">{totalSaidas}</p>
          </div>
        </div>
        <div className="flex items-center gap-3 rounded-xl border border-border bg-card p-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted text-muted-foreground">
            <Repeat className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Movimentações</p>
            <p className="text-xl font-bold text-foreground">{movements.length}</p>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {filters.map((f) => (
          <button
            key={f.key}
            type="button"
            onClick={() => setFilter(f.key)}
            className={cn(
              "rounded-lg px-3 py-1.5 text-sm font-medium transition-colors",
              filter === f.key
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground hover:bg-muted/70",
            )}
          >
            {f.label}
          </button>
        ))}
      </div>

      <div className="rounded-xl border border-border bg-card">
        {loading ? (
          <div className="p-12 text-center text-sm text-muted-foreground">
            Carregando...
          </div>
        ) : movements.length === 0 ? (
          <div className="flex flex-col items-center gap-2 p-16 text-center">
            <Repeat className="h-10 w-10 text-muted-foreground/40" />
            <p className="font-medium text-foreground">
              Nenhuma movimentação registrada
            </p>
            <p className="text-sm text-muted-foreground">
              Registre entradas e saídas no Almoxarifado para vê-las aqui.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted-foreground">
                  <th className="px-4 py-3 font-medium">Data</th>
                  <th className="px-4 py-3 font-medium">Hora</th>
                  <th className="px-4 py-3 font-medium">Tipo</th>
                  <th className="px-4 py-3 font-medium">Item</th>
                  <th className="px-4 py-3 font-medium">Referência</th>
                  <th className="px-4 py-3 font-medium">Veículo</th>
                  <th className="px-4 py-3 font-medium">Observação</th>
                  <th className="px-4 py-3 text-right font-medium">Qtd.</th>
                </tr>
              </thead>
              <tbody>
                {movements.map((m) => {
                  const isEntrada = m.type === "entrada"
                  return (
                    <tr
                      key={m.id}
                      className="border-b border-border last:border-0 hover:bg-muted/40"
                    >
                      <td className="px-4 py-3 text-muted-foreground">
                        {formatDate(m.createdAt)}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {formatTime(m.createdAt)}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={cn(
                            "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium",
                            isEntrada
                              ? "bg-primary/10 text-primary"
                              : "bg-destructive/10 text-destructive",
                          )}
                        >
                          {isEntrada ? (
                            <ArrowDownLeft className="h-3 w-3" />
                          ) : (
                            <ArrowUpRight className="h-3 w-3" />
                          )}
                          {isEntrada ? "Entrada" : "Saída"}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-medium text-foreground">
                        {m.itemName || "Item removido"}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {m.itemReference || "—"}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {m.vehiclePlate || "—"}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {m.note || "—"}
                      </td>
                      <td
                        className={cn(
                          "px-4 py-3 text-right font-semibold",
                          isEntrada ? "text-primary" : "text-destructive",
                        )}
                      >
                        {isEntrada ? "+" : "-"}
                        {m.quantity}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
