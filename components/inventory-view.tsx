"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  deleteItem,
  getItems,
  getStats,
} from "@/app/actions/inventory"
import type { InventoryItem } from "@/lib/db/schema"
import {
  AlertTriangle,
  ArrowDownToLine,
  ArrowUpFromLine,
  Boxes,
  DollarSign,
  Filter,
  Package,
  Pencil,
  Plus,
  Search,
  Trash2,
} from "lucide-react"
import { useCallback, useEffect, useMemo, useState, useTransition } from "react"
import { toast } from "sonner"
import { ItemFormDialog } from "./item-form-dialog"
import { MovementDialog } from "./movement-dialog"

function formatCurrency(value: number) {
  return value.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  })
}

type Stats = {
  totalItems: number
  totalUnits: number
  totalValue: number
  lowStock: number
}

export function InventoryView() {
  const [items, setItems] = useState<InventoryItem[]>([])
  const [stats, setStats] = useState<Stats | null>(null)
  const [search, setSearch] = useState("")
  const [loading, setLoading] = useState(true)
  const [, startTransition] = useTransition()

  const [formOpen, setFormOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null)

  const [movementOpen, setMovementOpen] = useState(false)
  const [movementType, setMovementType] = useState<"entrada" | "saida">("entrada")
  const [movementItem, setMovementItem] = useState<InventoryItem | null>(null)

  const load = useCallback(async (term: string) => {
    const [list, s] = await Promise.all([getItems(term), getStats()])
    setItems(list)
    setStats(s)
    setLoading(false)
  }, [])

  useEffect(() => {
    const handler = setTimeout(() => {
      load(search)
    }, 250)
    return () => clearTimeout(handler)
  }, [search, load])

  function refresh() {
    startTransition(() => {
      load(search)
    })
  }

  function openNew() {
    setEditingItem(null)
    setFormOpen(true)
  }

  function openEdit(item: InventoryItem) {
    setEditingItem(item)
    setFormOpen(true)
  }

  function openMovement(item: InventoryItem, type: "entrada" | "saida") {
    setMovementItem(item)
    setMovementType(type)
    setMovementOpen(true)
  }

  function handleDelete(item: InventoryItem) {
    if (!confirm(`Excluir o item "${item.name}"?`)) return
    startTransition(async () => {
      try {
        await deleteItem(item.id)
        toast.success("Item excluído")
        load(search)
      } catch {
        toast.error("Erro ao excluir o item")
      }
    })
  }

  const statCards = useMemo(
    () => [
      {
        label: "Itens cadastrados",
        value: stats ? String(stats.totalItems) : "—",
        icon: Package,
      },
      {
        label: "Unidades em estoque",
        value: stats ? String(stats.totalUnits) : "—",
        icon: Boxes,
      },
      {
        label: "Valor do estoque",
        value: stats ? formatCurrency(stats.totalValue) : "—",
        icon: DollarSign,
      },
      {
        label: "Estoque crítico",
        value: stats ? String(stats.lowStock) : "—",
        icon: AlertTriangle,
        alert: true,
      },
    ],
    [stats],
  )

  return (
    <div className="flex flex-col gap-6">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Estoque Interno
          </h1>
          <p className="text-sm text-muted-foreground">
            Gerencie as peças do almoxarifado
          </p>
        </div>
      </header>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {statCards.map((card) => {
          const Icon = card.icon
          return (
            <div
              key={card.label}
              className="flex items-center gap-4 rounded-xl border border-border bg-card p-4"
            >
              <div
                className={`flex h-11 w-11 items-center justify-center rounded-lg ${
                  card.alert
                    ? "bg-destructive/10 text-destructive"
                    : "bg-primary/10 text-primary"
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

      <div className="rounded-xl border border-border bg-card">
        <div className="flex flex-col gap-3 border-b border-border p-4 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por nome, referência, categoria, fabricante..."
              className="pl-9"
            />
          </div>
          <Button onClick={openNew}>
            <Plus className="h-4 w-4" />
            Novo Item
          </Button>
        </div>

        {loading ? (
          <div className="p-12 text-center text-sm text-muted-foreground">
            Carregando...
          </div>
        ) : items.length === 0 ? (
          <div className="flex flex-col items-center gap-2 p-16 text-center">
            <Filter className="h-10 w-10 text-muted-foreground/40" />
            <p className="font-medium text-foreground">Nenhum item encontrado</p>
            <p className="text-sm text-muted-foreground">
              {search
                ? "Tente buscar por outro termo."
                : "Cadastre o primeiro item do estoque."}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted-foreground">
                  <th className="px-4 py-3 font-medium">Item</th>
                  <th className="px-4 py-3 font-medium">Categoria</th>
                  <th className="px-4 py-3 font-medium">Local</th>
                  <th className="px-4 py-3 text-right font-medium">Qtd.</th>
                  <th className="px-4 py-3 text-right font-medium">Preço</th>
                  <th className="px-4 py-3 text-right font-medium">Ações</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => {
                  const low = item.quantity <= item.minQuantity
                  return (
                    <tr
                      key={item.id}
                      className="border-b border-border last:border-0 hover:bg-muted/40"
                    >
                      <td className="px-4 py-3">
                        <div className="flex flex-col">
                          <span className="font-medium text-foreground">
                            {item.name}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {[item.reference, item.manufacturer]
                              .filter(Boolean)
                              .join(" · ") || "—"}
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
                            low
                              ? "bg-destructive/10 text-destructive"
                              : "bg-primary/10 text-primary"
                          }`}
                        >
                          {low && <AlertTriangle className="h-3 w-3" />}
                          {item.quantity}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right text-foreground">
                        {formatCurrency(Number(item.unitPrice))}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-primary"
                            title="Entrada"
                            onClick={() => openMovement(item, "entrada")}
                          >
                            <ArrowDownToLine className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-amber-600"
                            title="Saída"
                            onClick={() => openMovement(item, "saida")}
                          >
                            <ArrowUpFromLine className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            title="Editar"
                            onClick={() => openEdit(item)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-destructive"
                            title="Excluir"
                            onClick={() => handleDelete(item)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <ItemFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        item={editingItem}
        onSaved={refresh}
      />
      <MovementDialog
        open={movementOpen}
        onOpenChange={setMovementOpen}
        type={movementType}
        item={movementItem}
        onSaved={refresh}
      />
    </div>
  )
}
