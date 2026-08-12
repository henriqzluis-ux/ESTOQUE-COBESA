"use client"

import { Input } from "@/components/ui/input"
import { getMovements } from "@/app/actions/inventory"
import {
  ArrowDownToLine,
  ArrowLeftRight,
  ArrowUpFromLine,
  Search,
} from "lucide-react"
import { useCallback, useEffect, useMemo, useState } from "react"
import { PageHeader, StatusBadge } from "./page-header"

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
  unitPrice: string | null
}

type Filter = "todas" | "entrada" | "saida"

function formatCurrency(value: number) {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })
}

function formatDateTime(date: Date | string) {
  return new Date(date).toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
}

export function StockMovementsView() {
  const [movements, setMovements] = useState<Movement[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<Filter>("todas")
  const [search, setSearch] = useState("")

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const rows = await getMovements()
      setMovements(rows as Movement[])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase()
    return movements.filter((m) => {
      if (filter !== "todas" && m.type !== filter) return false
      if (!term) return true
      return (
        (m.itemName ?? "").toLowerCase().includes(term) ||
        (m.itemReference ?? "").toLowerCase().includes(term) ||
        (m.note ?? "").toLowerCase().includes(term) ||
        (m.vehiclePlate ?? "").toLowerCase().includes(term)
      )
    })
  }, [movements, filter, search])

  const totalEntradas = movements
    .filter((m) => m.type === "entrada")
    .reduce((sum, m) => sum + m.quantity, 0)
  const totalSaidas = movements
    .filter((m) => m.type === "saida")
    .reduce((sum, m) => sum + m.quantity, 0)

  const filters: { key: Filter; label: string }[] = [
    { key: "todas", label: "Todas" },
    { key: "entrada", label: "Entradas" },
    { key: "saida", label: "Saídas" },
  ]

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Movimentação no Estoque"
        description="Todas as entradas e saídas de peças movimentadas no almoxarifado"
      />

      <div className="grid grid-cols-3 gap-4">
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-xs text-muted-foreground">Movimentações</p>
          <p className="text-xl font-bold text-foreground">{movements.length}</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-xs text-muted-foreground">Unidades em entrada</p>
          <p className="text-xl font-bold text-primary">+{totalEntradas}</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-xs text-muted-foreground">Unidades em saída</p>
          <p className="text-xl font-bold text-destructive">-{totalSaidas}</p>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card">
        <div className="flex flex-col gap-3 border-b border-border p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-1 rounded-lg bg-muted p-1">
            {filters.map((f) => (
              <button
                key={f.key}
                type="button"
                onClick={() => setFilter(f.key)}
                className={
                  "rounded-md px-3 py-1.5 text-sm font-medium transition-colors " +
                  (filter === f.key
                    ? "bg-card text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground")
                }
              >
                {f.label}
              </button>
            ))}
          </div>
          <div className="relative sm:max-w-xs sm:flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              className="pl-9"
              placeholder="Buscar item, referência, placa..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        {loading ? (
          <div className="p-12 text-center text-sm text-muted-foreground">
            Carregando...
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center gap-2 p-16 text-center">
            <ArrowLeftRight className="h-10 w-10 text-muted-foreground/40" />
            <p className="font-medium text-foreground">
              Nenhuma movimentação encontrada
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
                  <th className="px-4 py-3 font-medium">Tipo</th>
                  <th className="px-4 py-3 font-medium">Item</th>
                  <th className="px-4 py-3 font-medium">Referência</th>
                  <th className="px-4 py-3 font-medium">Observação</th>
                  <th className="px-4 py-3 font-medium">Veículo</th>
                  <th className="px-4 py-3 text-right font-medium">Qtd.</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((m) => {
                  const isEntrada = m.type === "entrada"
                  return (
                    <tr
                      key={m.id}
                      className="border-b border-border last:border-0 hover:bg-muted/40"
                    >
                      <td className="px-4 py-3 text-muted-foreground">
                        {formatDateTime(m.createdAt)}
                      </td>
                      <td className="px-4 py-3">
                        {isEntrada ? (
                          <StatusBadge label="Entrada" tone="success" />
                        ) : (
                          <StatusBadge label="Saída" tone="danger" />
                        )}
                      </td>
                      <td className="px-4 py-3 font-medium text-foreground">
                        {m.itemName || "Item removido"}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {m.itemReference || "—"}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {m.note || "—"}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {m.vehiclePlate || "—"}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <span
                          className={
                            "inline-flex items-center gap-1 font-semibold " +
                            (isEntrada ? "text-primary" : "text-destructive")
                          }
                        >
                          {isEntrada ? (
                            <ArrowDownToLine className="h-3.5 w-3.5" />
                          ) : (
                            <ArrowUpFromLine className="h-3.5 w-3.5" />
                          )}
                          {isEntrada ? `+${m.quantity}` : `-${m.quantity}`}
                        </span>
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
