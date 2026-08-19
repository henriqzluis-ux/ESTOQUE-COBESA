"use client"

import { Button } from "@/components/ui/button"
import {
  deletePreventive,
  getPreventives,
  markPreventiveDone,
} from "@/app/actions/preventives"
import { KM_ALERTA, KM_CRITICO } from "@/lib/preventive-status"
import { getVehicles, updateVehicleKm } from "@/app/actions/fleet"
import type { Vehicle } from "@/lib/db/schema"
import type { ViewKey } from "@/components/sidebar"
import { CalendarCheck, CheckCircle2, Gauge, Plus, Trash2 } from "lucide-react"
import { useCallback, useEffect, useState, useTransition } from "react"
import { toast } from "sonner"
import { PageHeader } from "./page-header"
import { PreventiveFormDialog } from "./preventive-form-dialog"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

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
  kmRodados: number
}

const statusMap: Record<
  string,
  { label: string; dot: string; text: string; badge: string }
> = {
  em_dia: {
    label: "Em dia",
    dot: "bg-emerald-500 shadow-[0_0_10px_2px] shadow-emerald-500/50",
    text: "text-emerald-600",
    badge: "bg-emerald-500/10 text-emerald-600",
  },
  alerta: {
    label: "Alerta",
    dot: "bg-amber-500 shadow-[0_0_10px_2px] shadow-amber-500/50",
    text: "text-amber-600",
    badge: "bg-amber-500/10 text-amber-600",
  },
  critico: {
    label: "Crítico",
    dot: "bg-red-500 shadow-[0_0_10px_2px] shadow-red-500/50 animate-pulse",
    text: "text-red-600",
    badge: "bg-red-500/10 text-red-600",
  },
}

function StatusDot({ status }: { status: string }) {
  const st = statusMap[status] ?? statusMap.em_dia
  return (
    <span className="inline-flex items-center gap-2">
      <span className={`h-3 w-3 shrink-0 rounded-full ${st.dot}`} aria-hidden />
      <span className={`text-xs font-semibold ${st.text}`}>{st.label}</span>
    </span>
  )
}

export function PreventivesView({ onNavigate }: { onNavigate: (v: ViewKey) => void }) {
  const [rows, setRows] = useState<PreventiveRow[]>([])
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [loading, setLoading] = useState(true)
  const [, startTransition] = useTransition()
  const [formOpen, setFormOpen] = useState(false)
  const [kmTarget, setKmTarget] = useState<PreventiveRow | null>(null)
  const [kmValue, setKmValue] = useState("")

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

  function openKmDialog(p: PreventiveRow) {
    setKmTarget(p)
    setKmValue(String(p.currentKm))
  }

  function handleUpdateKm() {
    if (!kmTarget) return
    const km = Number(kmValue)
    if (!Number.isFinite(km) || km < 0) {
      toast.error("Informe um valor de km válido")
      return
    }
    if (km < kmTarget.lastKm) {
      toast.error("O km atual não pode ser menor que o da última preventiva")
      return
    }
    const target = kmTarget
    startTransition(async () => {
      try {
        await updateVehicleKm(target.vehicleId, km)
        toast.success("KM do veículo atualizado")
        setKmTarget(null)
        load()
      } catch {
        toast.error("Erro ao atualizar o KM")
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
    critico: rows.filter((r) => r.status === "critico").length,
    alerta: rows.filter((r) => r.status === "alerta").length,
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
            <div className="flex items-center gap-3 rounded-xl border border-border bg-card p-4">
              <span className="h-3 w-3 shrink-0 rounded-full bg-emerald-500 shadow-[0_0_10px_2px] shadow-emerald-500/50" />
              <div>
                <p className="text-xs text-muted-foreground">Em dia</p>
                <p className="text-xl font-bold text-emerald-600">{counts.em_dia}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 rounded-xl border border-border bg-card p-4">
              <span className="h-3 w-3 shrink-0 rounded-full bg-amber-500 shadow-[0_0_10px_2px] shadow-amber-500/50" />
              <div>
                <p className="text-xs text-muted-foreground">Alerta</p>
                <p className="text-xl font-bold text-amber-600">{counts.alerta}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 rounded-xl border border-border bg-card p-4">
              <span className="h-3 w-3 shrink-0 rounded-full bg-red-500 shadow-[0_0_10px_2px] shadow-red-500/50" />
              <div>
                <p className="text-xs text-muted-foreground">Crítico</p>
                <p className="text-xl font-bold text-red-600">{counts.critico}</p>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-x-6 gap-y-2 rounded-xl border border-border bg-muted/30 px-4 py-3 text-xs text-muted-foreground">
            <span className="font-medium text-foreground">Legenda de km rodados:</span>
            <span className="inline-flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
              {"< "}
              {KM_ALERTA.toLocaleString("pt-BR")} km — Em dia
            </span>
            <span className="inline-flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full bg-amber-500" />
              {KM_ALERTA.toLocaleString("pt-BR")} a {KM_CRITICO.toLocaleString("pt-BR")} km — Alerta
            </span>
            <span className="inline-flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full bg-red-500" />
              {"≥ "}
              {KM_CRITICO.toLocaleString("pt-BR")} km — Crítico
            </span>
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
                      <th className="px-4 py-3 text-right font-medium">Atual (km)</th>
                      <th className="px-4 py-3 text-right font-medium">Rodados</th>
                      <th className="px-4 py-3 font-medium">Status</th>
                      <th className="px-4 py-3 text-right font-medium">Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((p) => {
                      const st = statusMap[p.status] ?? statusMap.em_dia
                      return (
                        <tr key={p.id} className="border-b border-border last:border-0 hover:bg-muted/40">
                          <td className="px-4 py-3 font-semibold text-foreground">{p.vehiclePlate}</td>
                          <td className="px-4 py-3 text-foreground">{p.description}</td>
                          <td className="px-4 py-3 text-right text-muted-foreground">
                            {p.lastKm.toLocaleString("pt-BR")}
                          </td>
                          <td className="px-4 py-3 text-right text-foreground">
                            {p.currentKm.toLocaleString("pt-BR")}
                          </td>
                          <td className={`px-4 py-3 text-right font-semibold ${st.text}`}>
                            {p.kmRodados.toLocaleString("pt-BR")} km
                          </td>
                          <td className="px-4 py-3">
                            <StatusDot status={p.status} />
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center justify-end gap-1">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-muted-foreground"
                                title="Atualizar KM rodados"
                                onClick={() => openKmDialog(p)}
                              >
                                <Gauge className="h-4 w-4" />
                              </Button>
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

      <Dialog open={kmTarget !== null} onOpenChange={(o) => !o && setKmTarget(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Atualizar KM rodados</DialogTitle>
          </DialogHeader>
          {kmTarget && (
            <div className="flex flex-col gap-4">
              <div className="rounded-lg border border-border bg-muted/30 p-3 text-sm">
                <p className="font-semibold text-foreground">{kmTarget.vehiclePlate}</p>
                <p className="text-muted-foreground">{kmTarget.description}</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Última preventiva: {kmTarget.lastKm.toLocaleString("pt-BR")} km
                </p>
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="km-atual">KM atual do veículo</Label>
                <Input
                  id="km-atual"
                  type="number"
                  min={kmTarget.lastKm}
                  value={kmValue}
                  onChange={(e) => setKmValue(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.nativeEvent.isComposing) handleUpdateKm()
                  }}
                />
                <p className="text-xs text-muted-foreground">
                  Rodados desde a última:{" "}
                  <span className="font-semibold text-foreground">
                    {Math.max(0, (Number(kmValue) || 0) - kmTarget.lastKm).toLocaleString("pt-BR")} km
                  </span>
                </p>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setKmTarget(null)}>
              Cancelar
            </Button>
            <Button onClick={handleUpdateKm}>Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
