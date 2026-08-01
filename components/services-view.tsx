"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { deleteService, getServices } from "@/app/actions/services"
import { getVehicles } from "@/app/actions/fleet"
import type { Service, Vehicle } from "@/lib/db/schema"
import { Plus, Search, Trash2, Wrench } from "lucide-react"
import { useCallback, useEffect, useState, useTransition } from "react"
import { toast } from "sonner"
import { PageHeader } from "./page-header"
import { ServiceFormDialog } from "./service-form-dialog"

function formatCurrency(value: number) {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })
}

function formatDate(date: Date | string) {
  return new Date(date).toLocaleDateString("pt-BR")
}

export function ServicesView() {
  const [services, setServices] = useState<Service[]>([])
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [search, setSearch] = useState("")
  const [loading, setLoading] = useState(true)
  const [, startTransition] = useTransition()
  const [formOpen, setFormOpen] = useState(false)

  const load = useCallback(async (term: string) => {
    const [list, vlist] = await Promise.all([getServices(term), getVehicles()])
    setServices(list)
    setVehicles(vlist)
    setLoading(false)
  }, [])

  useEffect(() => {
    const handler = setTimeout(() => load(search), 250)
    return () => clearTimeout(handler)
  }, [search, load])

  function refresh() {
    startTransition(() => load(search))
  }

  function handleDelete(s: Service) {
    if (!confirm("Excluir este registro de serviço?")) return
    startTransition(async () => {
      try {
        await deleteService(s.id)
        toast.success("Serviço excluído")
        load(search)
      } catch {
        toast.error("Erro ao excluir o serviço")
      }
    })
  }

  const totalCost = services.reduce((sum, s) => sum + Number(s.cost), 0)

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Histórico de Manutenções"
        description="Registro completo de manutenções e trocas de peças"
        actions={
          <Button onClick={() => setFormOpen(true)} disabled={vehicles.length === 0}>
            <Plus className="h-4 w-4" />
            Novo Serviço
          </Button>
        }
      />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-3">
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-xs text-muted-foreground">Serviços registrados</p>
          <p className="text-xl font-bold text-foreground">{services.length}</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-xs text-muted-foreground">Custo total</p>
          <p className="text-xl font-bold text-foreground">{formatCurrency(totalCost)}</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-xs text-muted-foreground">Custo médio</p>
          <p className="text-xl font-bold text-foreground">
            {formatCurrency(services.length ? totalCost / services.length : 0)}
          </p>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card">
        <div className="border-b border-border p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por placa, tipo, fornecedor..."
              className="pl-9"
            />
          </div>
        </div>

        {loading ? (
          <div className="p-12 text-center text-sm text-muted-foreground">Carregando...</div>
        ) : vehicles.length === 0 ? (
          <div className="flex flex-col items-center gap-2 p-16 text-center">
            <Wrench className="h-10 w-10 text-muted-foreground/40" />
            <p className="font-medium text-foreground">Nenhum veículo cadastrado</p>
            <p className="text-sm text-muted-foreground">
              Cadastre veículos na aba Minha Frota para registrar serviços.
            </p>
          </div>
        ) : services.length === 0 ? (
          <div className="flex flex-col items-center gap-2 p-16 text-center">
            <Wrench className="h-10 w-10 text-muted-foreground/40" />
            <p className="font-medium text-foreground">Nenhum serviço registrado ainda</p>
            <p className="text-sm text-muted-foreground">Registre a primeira manutenção.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted-foreground">
                  <th className="px-4 py-3 font-medium">Data</th>
                  <th className="px-4 py-3 font-medium">Veículo</th>
                  <th className="px-4 py-3 font-medium">Tipo / Descrição</th>
                  <th className="px-4 py-3 font-medium">Fornecedor</th>
                  <th className="px-4 py-3 text-right font-medium">KM</th>
                  <th className="px-4 py-3 text-right font-medium">Custo</th>
                  <th className="px-4 py-3 text-right font-medium">Ações</th>
                </tr>
              </thead>
              <tbody>
                {services.map((s) => (
                  <tr key={s.id} className="border-b border-border last:border-0 hover:bg-muted/40">
                    <td className="px-4 py-3 text-muted-foreground">{formatDate(s.serviceDate)}</td>
                    <td className="px-4 py-3 font-semibold text-foreground">{s.vehiclePlate || "—"}</td>
                    <td className="px-4 py-3">
                      <div className="flex flex-col">
                        <span className="font-medium text-foreground">{s.serviceType}</span>
                        {s.description && (
                          <span className="text-xs text-muted-foreground line-clamp-1">
                            {s.description}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{s.provider || "—"}</td>
                    <td className="px-4 py-3 text-right text-foreground">
                      {s.km.toLocaleString("pt-BR")}
                    </td>
                    <td className="px-4 py-3 text-right font-medium text-foreground">
                      {formatCurrency(Number(s.cost))}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive"
                          title="Excluir"
                          onClick={() => handleDelete(s)}
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

      <ServiceFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        vehicles={vehicles}
        onSaved={refresh}
      />
    </div>
  )
}
