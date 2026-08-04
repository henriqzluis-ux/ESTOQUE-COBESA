"use client"

import { Button } from "@/components/ui/button"
import {
  deletePreventive,
  getPreventives,
  markPreventiveDone,
} from "@/app/actions/preventives"
import { getVehicles } from "@/app/actions/fleet"
import type { Vehicle } from "@/lib/db/schema"
import type { ViewKey } from "@/components/sidebar"
import { CalendarCheck, CheckCircle2, Plus, Trash2 } from "lucide-react"
import { useCallback, useEffect, useState, useTransition } from "react"
import { toast } from "sonner"
import { PageHeader, StatusBadge } from "./page-header"
import { PreventiveFormDialog } from "./preventive-form-dialog"

type PreventiveRow = {
  id: number
  vehicleId: number
  vehiclePlate: string | null
  description: string
  intervalKm: number
  lastKm: number
  nextKm: number
  status: string
  currentKm: number
}

const statusMap: Record<string, { label: string; tone: "success" | "warning" | "danger" | "neutral" }> = {
  em_dia: { label: "Em dia", tone: "success" },
  proximo: { label: "Próximo", tone: "warning" },
  vencido: { label: "Vencido", tone: "danger" },
}

export function PreventivesView({ onNavigate }: { onNavigate: (v: ViewKey) => void }) {
  const [rows, setRows] = useState<PreventiveRow[]>([])
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [loading, setLoading] = useState(true)
  const [, startTransition] = useTransition()
  const [formOpen, setFormOpen] = useState(false)

  const load = useCallback(async () => {
    const [list, vlist] = await Promise.all([getPreventives(), getVehicles()])
    setRows(list as PreventiveRow[])
    setVehicles(vlist)
    setLoading(false)
  }, [])

  useEffect(() => {
    load()
  }, [load])

  function refresh() {
    startTransition(() => load())
  }

  function handleDone(p: PreventiveRow) {
    startTransition(async () => {
      try {
        await markPreventiveDone(p.id)
        toast.success("Preventiva marcada como realizada")
        load()
      } catch {
        toast.error("Erro ao atualizar a preventiva")
      }
    })
  }

  function handleDelete(p: PreventiveRow) {
    if (!confirm("Excluir esta preventiva?")) return
    startTransition(async () => {
      try {
        await deletePreventive(p.id)
        toast.success("Preventiva excluída")
        load()
      } catch {
        toast.error("Erro ao excluir a preventiva")
      }
    })
  }

  const counts = {
    vencido: rows.filter((r) => r.status === "vencido").length,
    proximo: rows.filter((r) => r.status === "proximo").length,
    em_dia: rows.filter((r) => r.status === "em_dia").length,
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Controle de Preventivas"
        description="Monitoramento de manutenções programadas da frota"
        actions={
          <Button onClick={() => setFormOpen(true)} disabled={vehicles.length === 0}>
            <Plus className="h-4 w-4" />
            Nova Preventiva
          </Button>
        }
      />

      {vehicles.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-xl border border-border bg-card p-16 text-center">
          <CalendarCheck className="h-10 w-10 text-muted-foreground/40" />
          <div>
            <p className="font-medium text-foreground">Nenhum veículo cadastrado</p>
            <p className="text-sm text-muted-foreground">
              Cadastre veículos na aba Minha Frota para agendar preventivas.
            </p>
          </div>
          <Button variant="outline" onClick={() => onNavigate("frota")}>
            Ir para Minha Frota
          </Button>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-3 gap-4">
            <div className="rounded-xl border border-border bg-card p-4">
              <p className="text-xs text-muted-foreground">Vencidas</p>
              <p className="text-xl font-bold text-destructive">{counts.vencido}</p>
            </div>
            <div className="rounded-xl border border-border bg-card p-4">
              <p className="text-xs text-muted-foreground">Próximas</p>
              <p className="text-xl font-bold text-amber-600">{counts.proximo}</p>
            </div>
            <div className="rounded-xl border border-border bg-card p-4">
              <p className="text-xs text-muted-foreground">Em dia</p>
              <p className="text-xl font-bold text-primary">{counts.em_dia}</p>
            </div>
          </div>

          <div className="rounded-xl border border-border bg-card">
            {loading ? (
              <div className="p-12 text-center text-sm text-muted-foreground">Carregando...</div>
            ) : rows.length === 0 ? (
              <div className="flex flex-col items-center gap-2 p-16 text-center">
                <CalendarCheck className="h-10 w-10 text-muted-foreground/40" />
                <p className="font-medium text-foreground">Nenhuma preventiva agendada</p>
                <p className="text-sm text-muted-foreground">Agende a primeira preventiva.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted-foreground">
                      <th className="px-4 py-3 font-medium">Veículo</th>
                      <th className="px-4 py-3 font-medium">Descrição</th>
                      <th className="px-4 py-3 text-right font-medium">Última (km)</th>
                      <th className="px-4 py-3 text-right font-medium">Próxima (km)</th>
                      <th className="px-4 py-3 text-right font-medium">Faltam</th>
                      <th className="px-4 py-3 font-medium">Status</th>
                      <th className="px-4 py-3 text-right font-medium">Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((p) => {
                      const st = statusMap[p.status] ?? statusMap.em_dia
                      const remaining = p.nextKm - p.currentKm
                      return (
                        <tr key={p.id} className="border-b border-border last:border-0 hover:bg-muted/40">
                          <td className="px-4 py-3 font-semibold text-foreground">{p.vehiclePlate}</td>
                          <td className="px-4 py-3 text-foreground">{p.description}</td>
                          <td className="px-4 py-3 text-right text-muted-foreground">
                            {p.lastKm.toLocaleString("pt-BR")}
                          </td>
                          <td className="px-4 py-3 text-right text-foreground">
                            {p.nextKm.toLocaleString("pt-BR")}
                          </td>
                          <td className="px-4 py-3 text-right text-muted-foreground">
                            {remaining > 0 ? `${remaining.toLocaleString("pt-BR")} km` : "Vencida"}
                          </td>
                          <td className="px-4 py-3">
                            <StatusBadge label={st.label} tone={st.tone} />
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center justify-end gap-1">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-primary"
                                title="Marcar como realizada"
                                onClick={() => handleDone(p)}
                              >
                                <CheckCircle2 className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-destructive"
                                title="Excluir"
                                onClick={() => handleDelete(p)}
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
        </>
      )}

      <PreventiveFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        vehicles={vehicles}
        onSaved={refresh}
      />
    </div>
  )
}
