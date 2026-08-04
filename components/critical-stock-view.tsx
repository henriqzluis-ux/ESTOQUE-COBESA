"use client"

import { getCriticalItems } from "@/app/actions/inventory"
import { Input } from "@/components/ui/input"
import type { InventoryItem } from "@/lib/db/schema"
import { AlertTriangle, CheckCircle2, PackageX, Search, TrendingDown } from "lucide-react"
import { useEffect, useMemo, useState } from "react"

function formatCurrency(value: number) {
  return value.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  })
}

export function CriticalStockView() {
  const [items, setItems] = useState<InventoryItem[]>([])
  const [search, setSearch] = useState("")
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getCriticalItems()
      .then((list) => setItems(list))
      .finally(() => setLoading(false))
  }, [])

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase()
    if (!term) return items
    return items.filter((item) =>
      [item.name, item.reference, item.category, item.manufacturer, item.location]
        .filter(Boolean)
        .some((field) => field!.toLowerCase().includes(term)),
    )
  }, [items, search])

  const zeroed = useMemo(
    () => filtered.filter((item) => item.quantity <= 0),
    [filtered],
  )
  const critical = useMemo(
    () => filtered.filter((item) => item.quantity > 0),
    [filtered],
  )

  const statCards = useMemo(
    () => [
      {
        label: "Itens zerados",
        value: items.filter((i) => i.quantity <= 0).length,
        icon: PackageX,
        tone: "danger" as const,
      },
      {
        label: "Abaixo do mínimo",
        value: items.filter((i) => i.quantity > 0).length,
        icon: TrendingDown,
        tone: "warning" as const,
      },
      {
        label: "Total em alerta",
        value: items.length,
        icon: AlertTriangle,
        tone: "warning" as const,
      },
    ],
    [items],
  )

  return (
    <div className="flex flex-col gap-6">
      <header>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          Estoque Crítico
        </h1>
        <p className="text-sm text-muted-foreground">
          Itens do almoxarifado zerados ou abaixo da quantidade mínima
        </p>
      </header>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {statCards.map((card) => {
          const Icon = card.icon
          return (
            <div
              key={card.label}
              className="flex items-center gap-4 rounded-xl border border-border bg-card p-4"
            >
              <div
                className={`flex h-11 w-11 items-center justify-center rounded-lg ${
                  card.tone === "danger"
                    ? "bg-destructive/10 text-destructive"
                    : "bg-amber-500/10 text-amber-600"
                }`}
              >
                <Icon className="h-5 w-5" />
              </div>
              <div className="leading-tight">
                <p className="text-xs text-muted-foreground">{card.label}</p>
                <p className="text-xl font-bold text-foreground">{card.value}</p>
              </div>
            </div>
          )
        })}
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar por nome, referência, categoria, fabricante..."
          className="pl-9"
        />
      </div>

      {loading ? (
        <div className="rounded-xl border border-border bg-card p-12 text-center text-sm text-muted-foreground">
          Carregando...
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center gap-2 rounded-xl border border-border bg-card p-16 text-center">
          <CheckCircle2 className="h-10 w-10 text-primary/60" />
          <p className="font-medium text-foreground">
            {search ? "Nenhum item encontrado" : "Nenhum item em situação crítica"}
          </p>
          <p className="text-sm text-muted-foreground">
            {search
              ? "Tente buscar por outro termo."
              : "Todos os itens do almoxarifado estão acima da quantidade mínima."}
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-6">
          {zeroed.length > 0 && (
            <CriticalTable
              title="Itens zerados"
              description="Sem estoque disponível"
              items={zeroed}
              variant="danger"
            />
          )}
          {critical.length > 0 && (
            <CriticalTable
              title="Abaixo do mínimo"
              description="Estoque acima de zero, porém abaixo do mínimo definido"
              items={critical}
              variant="warning"
            />
          )}
        </div>
      )}
    </div>
  )
}

function CriticalTable({
  title,
  description,
  items,
  variant,
}: {
  title: string
  description: string
  items: InventoryItem[]
  variant: "danger" | "warning"
}) {
  return (
    <div className="rounded-xl border border-border bg-card">
      <div className="flex items-center justify-between border-b border-border p-4">
        <div className="flex items-center gap-3">
          <span
            className={`flex h-9 w-9 items-center justify-center rounded-lg ${
              variant === "danger"
                ? "bg-destructive/10 text-destructive"
                : "bg-amber-500/10 text-amber-600"
            }`}
          >
            {variant === "danger" ? (
              <PackageX className="h-5 w-5" />
            ) : (
              <TrendingDown className="h-5 w-5" />
            )}
          </span>
          <div className="leading-tight">
            <p className="font-semibold text-foreground">{title}</p>
            <p className="text-xs text-muted-foreground">{description}</p>
          </div>
        </div>
        <span className="rounded-full bg-muted px-2.5 py-1 text-xs font-medium text-muted-foreground">
          {items.length} {items.length === 1 ? "item" : "itens"}
        </span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted-foreground">
              <th className="px-4 py-3 font-medium">Item</th>
              <th className="px-4 py-3 font-medium">Categoria</th>
              <th className="px-4 py-3 font-medium">Local</th>
              <th className="px-4 py-3 text-right font-medium">Qtd. atual</th>
              <th className="px-4 py-3 text-right font-medium">Mínimo</th>
              <th className="px-4 py-3 text-right font-medium">Preço</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr
                key={item.id}
                className="border-b border-border last:border-0 hover:bg-muted/40"
              >
                <td className="px-4 py-3">
                  <div className="flex flex-col">
                    <span className="font-medium text-foreground">{item.name}</span>
                    <span className="text-xs text-muted-foreground">
                      {[item.reference, item.manufacturer].filter(Boolean).join(" · ") ||
                        "—"}
                    </span>
                  </div>
                </td>
                <td className="px-4 py-3 text-muted-foreground">
                  {item.category || "—"}
                </td>
                <td className="px-4 py-3 text-muted-foreground">
                  {item.location || "—"}
                </td>
                <td className="px-4 py-3 text-right">
                  <span
                    className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${
                      item.quantity <= 0
                        ? "bg-destructive/10 text-destructive"
                        : "bg-amber-500/10 text-amber-600"
                    }`}
                  >
                    <AlertTriangle className="h-3 w-3" />
                    {item.quantity}
                  </span>
                </td>
                <td className="px-4 py-3 text-right text-muted-foreground">
                  {item.minQuantity}
                </td>
                <td className="px-4 py-3 text-right text-foreground">
                  {formatCurrency(Number(item.unitPrice))}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
