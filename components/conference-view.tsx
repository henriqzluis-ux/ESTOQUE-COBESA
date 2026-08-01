"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  cancelConference,
  finishConference,
  getConferenceItems,
  getConferences,
  getOpenConference,
  startConference,
  updatePhysicalQuantity,
} from "@/app/actions/conference"
import type { Conference, ConferenceItem } from "@/lib/db/schema"
import { ClipboardList, Play, X } from "lucide-react"
import { useCallback, useEffect, useState, useTransition } from "react"
import { toast } from "sonner"
import { PageHeader, StatusBadge } from "./page-header"

function formatDateTime(date: Date | string) {
  return new Date(date).toLocaleString("pt-BR")
}

export function ConferenceView() {
  const [open, setOpen] = useState<Conference | null>(null)
  const [items, setItems] = useState<ConferenceItem[]>([])
  const [history, setHistory] = useState<Conference[]>([])
  const [loading, setLoading] = useState(true)
  const [isPending, startTransition] = useTransition()
  const [drafts, setDrafts] = useState<Record<number, string>>({})

  const load = useCallback(async () => {
    const [current, hist] = await Promise.all([getOpenConference(), getConferences()])
    setOpen(current)
    setHistory(hist)
    if (current) {
      const cItems = await getConferenceItems(current.id)
      setItems(cItems)
      const d: Record<number, string> = {}
      for (const ci of cItems) {
        d[ci.id] = ci.physicalQuantity === null ? "" : String(ci.physicalQuantity)
      }
      setDrafts(d)
    } else {
      setItems([])
      setDrafts({})
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    load()
  }, [load])

  function handleStart() {
    startTransition(async () => {
      try {
        await startConference()
        toast.success("Conferência iniciada")
        load()
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Erro ao iniciar conferência")
      }
    })
  }

  function handleChange(ci: ConferenceItem, value: string) {
    setDrafts((prev) => ({ ...prev, [ci.id]: value }))
  }

  function handleBlur(ci: ConferenceItem) {
    const raw = drafts[ci.id]
    const value = raw === "" ? null : Number(raw)
    startTransition(async () => {
      await updatePhysicalQuantity(ci.id, value)
      setItems((prev) =>
        prev.map((it) => (it.id === ci.id ? { ...it, physicalQuantity: value } : it)),
      )
    })
  }

  function handleFinish(adjust: boolean) {
    if (!open) return
    const msg = adjust
      ? "Finalizar e ajustar o estoque do sistema com base na contagem física?"
      : "Finalizar a conferência sem ajustar o estoque?"
    if (!confirm(msg)) return
    startTransition(async () => {
      try {
        const div = await finishConference(open.id, adjust)
        toast.success(`Conferência finalizada com ${div} divergência(s)`)
        load()
      } catch {
        toast.error("Erro ao finalizar a conferência")
      }
    })
  }

  function handleCancel() {
    if (!open) return
    if (!confirm("Cancelar e descartar esta conferência?")) return
    startTransition(async () => {
      await cancelConference(open.id)
      toast.success("Conferência cancelada")
      load()
    })
  }

  const conferred = items.filter((i) => i.physicalQuantity !== null).length
  const divergences = items.filter(
    (i) => i.physicalQuantity !== null && i.physicalQuantity !== i.systemQuantity,
  ).length

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Conferência de Estoque"
        description="Verifique o estoque físico e compare com o sistema"
        actions={
          !open && (
            <Button onClick={handleStart} disabled={isPending}>
              <Play className="h-4 w-4" />
              Iniciar Conferência
            </Button>
          )
        }
      />

      {loading ? (
        <div className="rounded-xl border border-border bg-card p-12 text-center text-sm text-muted-foreground">
          Carregando...
        </div>
      ) : open ? (
        <div className="rounded-xl border border-border bg-card">
          <div className="flex flex-col gap-3 border-b border-border p-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-4 text-sm">
              <span className="text-muted-foreground">
                Iniciada em {formatDateTime(open.createdAt)}
              </span>
              <span className="font-medium text-foreground">
                {conferred}/{items.length} itens conferidos
              </span>
              {divergences > 0 && (
                <StatusBadge label={`${divergences} divergência(s)`} tone="danger" />
              )}
            </div>
            <div className="flex items-center gap-2">
              <Button variant="ghost" onClick={handleCancel} disabled={isPending}>
                <X className="h-4 w-4" />
                Cancelar
              </Button>
              <Button variant="outline" onClick={() => handleFinish(false)} disabled={isPending}>
                Finalizar sem ajustar
              </Button>
              <Button onClick={() => handleFinish(true)} disabled={isPending}>
                Finalizar e ajustar estoque
              </Button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted-foreground">
                  <th className="px-4 py-3 font-medium">Item</th>
                  <th className="px-4 py-3 text-right font-medium">Sistema</th>
                  <th className="px-4 py-3 text-right font-medium">Físico</th>
                  <th className="px-4 py-3 text-right font-medium">Diferença</th>
                </tr>
              </thead>
              <tbody>
                {items.map((ci) => {
                  const phys = ci.physicalQuantity
                  const diff = phys === null ? null : phys - ci.systemQuantity
                  return (
                    <tr key={ci.id} className="border-b border-border last:border-0 hover:bg-muted/40">
                      <td className="px-4 py-3 font-medium text-foreground">{ci.itemName}</td>
                      <td className="px-4 py-3 text-right text-muted-foreground">
                        {ci.systemQuantity}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex justify-end">
                          <Input
                            type="number"
                            min={0}
                            className="h-8 w-24 text-right"
                            value={drafts[ci.id] ?? ""}
                            onChange={(e) => handleChange(ci, e.target.value)}
                            onBlur={() => handleBlur(ci)}
                            placeholder="—"
                          />
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right">
                        {diff === null ? (
                          <span className="text-muted-foreground">—</span>
                        ) : diff === 0 ? (
                          <span className="text-primary">0</span>
                        ) : (
                          <span className="font-medium text-destructive">
                            {diff > 0 ? `+${diff}` : diff}
                          </span>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="rounded-xl border border-border bg-card">
          <div className="border-b border-border p-4">
            <h2 className="font-semibold text-foreground">Histórico de Conferências</h2>
          </div>
          {history.length === 0 ? (
            <div className="flex flex-col items-center gap-2 p-16 text-center">
              <ClipboardList className="h-10 w-10 text-muted-foreground/40" />
              <p className="font-medium text-foreground">Nenhuma conferência realizada ainda</p>
              <p className="text-sm text-muted-foreground">
                Inicie a primeira conferência de estoque.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted-foreground">
                    <th className="px-4 py-3 font-medium">Início</th>
                    <th className="px-4 py-3 font-medium">Finalização</th>
                    <th className="px-4 py-3 font-medium">Status</th>
                    <th className="px-4 py-3 text-right font-medium">Divergências</th>
                  </tr>
                </thead>
                <tbody>
                  {history.map((c) => (
                    <tr key={c.id} className="border-b border-border last:border-0 hover:bg-muted/40">
                      <td className="px-4 py-3 text-muted-foreground">{formatDateTime(c.createdAt)}</td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {c.finishedAt ? formatDateTime(c.finishedAt) : "—"}
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge
                          label={c.status === "finalizada" ? "Finalizada" : "Aberta"}
                          tone={c.status === "finalizada" ? "success" : "warning"}
                        />
                      </td>
                      <td className="px-4 py-3 text-right">
                        {c.divergences > 0 ? (
                          <span className="font-medium text-destructive">{c.divergences}</span>
                        ) : (
                          <span className="text-primary">0</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
