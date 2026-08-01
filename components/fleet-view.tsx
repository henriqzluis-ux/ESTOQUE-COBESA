"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { deleteVehicle, getVehicles } from "@/app/actions/fleet"
import type { Vehicle } from "@/lib/db/schema"
import { Pencil, Plus, Search, Trash2, Truck } from "lucide-react"
import { useCallback, useEffect, useState, useTransition } from "react"
import { toast } from "sonner"
import { PageHeader, StatusBadge } from "./page-header"
import { VehicleFormDialog } from "./vehicle-form-dialog"

const statusMap: Record<string, { label: string; tone: "success" | "warning" | "danger" | "neutral" }> = {
  ativo: { label: "Ativo", tone: "success" },
  manutencao: { label: "Em manutenção", tone: "warning" },
  inativo: { label: "Inativo", tone: "neutral" },
}

export function FleetView() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [search, setSearch] = useState("")
  const [loading, setLoading] = useState(true)
  const [, startTransition] = useTransition()

  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<Vehicle | null>(null)

  const load = useCallback(async (term: string) => {
    const list = await getVehicles(term)
    setVehicles(list)
    setLoading(false)
  }, [])

  useEffect(() => {
    const handler = setTimeout(() => load(search), 250)
    return () => clearTimeout(handler)
  }, [search, load])

  function refresh() {
    startTransition(() => load(search))
  }

  function openNew() {
    setEditing(null)
    setFormOpen(true)
  }

  function openEdit(v: Vehicle) {
    setEditing(v)
    setFormOpen(true)
  }

  function handleDelete(v: Vehicle) {
    if (!confirm(`Excluir o veículo "${v.plate}"? Isso remove serviços e preventivas vinculados.`)) return
    startTransition(async () => {
      try {
        await deleteVehicle(v.id)
        toast.success("Veículo excluído")
        load(search)
      } catch {
        toast.error("Erro ao excluir o veículo")
      }
    })
  }

  const active = vehicles.filter((v) => v.status === "ativo").length

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Gestão de Veículos"
        description={`${vehicles.length} veículos cadastrados · ${active} ativos`}
        actions={
          <Button onClick={openNew}>
            <Plus className="h-4 w-4" />
            Novo Veículo
          </Button>
        }
      />

      <div className="rounded-xl border border-border bg-card">
        <div className="border-b border-border p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por placa, modelo ou marca..."
              className="pl-9"
            />
          </div>
        </div>

        {loading ? (
          <div className="p-12 text-center text-sm text-muted-foreground">Carregando...</div>
        ) : vehicles.length === 0 ? (
          <div className="flex flex-col items-center gap-2 p-16 text-center">
            <Truck className="h-10 w-10 text-muted-foreground/40" />
            <p className="font-medium text-foreground">Nenhum veículo cadastrado</p>
            <p className="text-sm text-muted-foreground">
              Cadastre o primeiro veículo da frota.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted-foreground">
                  <th className="px-4 py-3 font-medium">Placa</th>
                  <th className="px-4 py-3 font-medium">Modelo / Marca</th>
                  <th className="px-4 py-3 font-medium">Tipo</th>
                  <th className="px-4 py-3 text-right font-medium">KM Atual</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 text-right font-medium">Ações</th>
                </tr>
              </thead>
              <tbody>
                {vehicles.map((v) => {
                  const st = statusMap[v.status] ?? statusMap.ativo
                  return (
                    <tr key={v.id} className="border-b border-border last:border-0 hover:bg-muted/40">
                      <td className="px-4 py-3 font-semibold text-foreground">{v.plate}</td>
                      <td className="px-4 py-3">
                        <div className="flex flex-col">
                          <span className="font-medium text-foreground">{v.model || "—"}</span>
                          <span className="text-xs text-muted-foreground">{v.brand || "—"}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">{v.type || "—"}</td>
                      <td className="px-4 py-3 text-right text-foreground">
                        {v.currentKm.toLocaleString("pt-BR")} km
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge label={st.label} tone={st.tone} />
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            title="Editar"
                            onClick={() => openEdit(v)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-destructive"
                            title="Excluir"
                            onClick={() => handleDelete(v)}
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

      <VehicleFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        vehicle={editing}
        onSaved={refresh}
      />
    </div>
  )
}
