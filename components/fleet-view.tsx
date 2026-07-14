"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { deleteVehicle, getFleetStats, getVehicles } from "@/app/actions/fleet"
import type { Vehicle } from "@/lib/db/schema"
import {
  Gauge,
  Pencil,
  Plus,
  Search,
  Trash2,
  Truck,
  Wrench,
} from "lucide-react"
import { useCallback, useEffect, useMemo, useState, useTransition } from "react"
import { toast } from "sonner"
import { VehicleFormDialog } from "./vehicle-form-dialog"

type Stats = {
  totalVehicles: number
  active: number
  maintenance: number
  totalKm: number
}

const statusStyles: Record<string, string> = {
  Ativo: "bg-primary/10 text-primary",
  Manutenção: "bg-amber-500/10 text-amber-600",
  Inativo: "bg-muted text-muted-foreground",
}

export function FleetView() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [stats, setStats] = useState<Stats | null>(null)
  const [search, setSearch] = useState("")
  const [loading, setLoading] = useState(true)
  const [, startTransition] = useTransition()

  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<Vehicle | null>(null)

  const load = useCallback(async (term: string) => {
    const [list, s] = await Promise.all([getVehicles(term), getFleetStats()])
    setVehicles(list)
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
    setEditing(null)
    setFormOpen(true)
  }

  function openEdit(vehicle: Vehicle) {
    setEditing(vehicle)
    setFormOpen(true)
  }

  function handleDelete(vehicle: Vehicle) {
    if (!confirm(`Excluir o veículo "${vehicle.plate}"?`)) return
    startTransition(async () => {
      try {
        await deleteVehicle(vehicle.id)
        toast.success("Veículo excluído")
        load(search)
      } catch {
        toast.error("Erro ao excluir o veículo")
      }
    })
  }

  const statCards = useMemo(
    () => [
      {
        label: "Frota cadastrada",
        value: stats ? String(stats.totalVehicles) : "—",
        icon: Truck,
      },
      {
        label: "Veículos ativos",
        value: stats ? String(stats.active) : "—",
        icon: Gauge,
      },
      {
        label: "Em manutenção",
        value: stats ? String(stats.maintenance) : "—",
        icon: Wrench,
        alert: true,
      },
      {
        label: "KM total",
        value: stats ? stats.totalKm.toLocaleString("pt-BR") : "—",
        icon: Gauge,
      },
    ],
    [stats],
  )

  return (
    <div className="flex flex-col gap-6">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Gestão de Veículos
          </h1>
          <p className="text-sm text-muted-foreground">
            Gerencie os veículos da sua frota
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
                    ? "bg-amber-500/10 text-amber-600"
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
          <div className="flex items-center gap-2 sm:mr-auto">
            <Truck className="h-5 w-5 text-primary" />
            <span className="text-sm font-semibold uppercase tracking-wide text-foreground">
              Frota Cadastrada
            </span>
          </div>
          <div className="relative flex-1 sm:max-w-xs">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por placa, modelo, marca..."
              className="pl-9"
            />
          </div>
          <Button onClick={openNew}>
            <Plus className="h-4 w-4" />
            Novo Veículo
          </Button>
        </div>

        {loading ? (
          <div className="p-12 text-center text-sm text-muted-foreground">
            Carregando...
          </div>
        ) : vehicles.length === 0 ? (
          <div className="flex flex-col items-center gap-2 p-16 text-center">
            <Truck className="h-10 w-10 text-muted-foreground/40" />
            <p className="font-medium text-foreground">
              Nenhum veículo encontrado
            </p>
            <p className="text-sm text-muted-foreground">
              {search
                ? "Tente buscar por outro termo."
                : "Cadastre o primeiro veículo da frota."}
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
                {vehicles.map((vehicle) => (
                  <tr
                    key={vehicle.id}
                    className="border-b border-border last:border-0 hover:bg-muted/40"
                  >
                    <td className="px-4 py-3 font-medium text-foreground">
                      {vehicle.plate}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-col">
                        <span className="font-medium text-foreground">
                          {vehicle.model}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {vehicle.brand || "—"}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {vehicle.type}
                    </td>
                    <td className="px-4 py-3 text-right text-foreground">
                      {vehicle.currentKm.toLocaleString("pt-BR")} km
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                          statusStyles[vehicle.status] ??
                          "bg-muted text-muted-foreground"
                        }`}
                      >
                        {vehicle.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          title="Editar"
                          onClick={() => openEdit(vehicle)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive"
                          title="Excluir"
                          onClick={() => handleDelete(vehicle)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
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
