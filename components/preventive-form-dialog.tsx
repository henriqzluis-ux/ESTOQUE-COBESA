"use client"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { createPreventive, type PreventiveInput } from "@/app/actions/preventives"
import type { Vehicle } from "@/lib/db/schema"
import { useState, useTransition } from "react"
import { toast } from "sonner"

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  vehicles: Vehicle[]
  onSaved: () => void
}

export function PreventiveFormDialog({ open, onOpenChange, vehicles, onSaved }: Props) {
  const [isPending, startTransition] = useTransition()
  const [vehicleId, setVehicleId] = useState<string>("")

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const form = new FormData(e.currentTarget)
    const selected = vehicles.find((v) => String(v.id) === vehicleId)

    if (!selected) {
      toast.error("Selecione um veículo")
      return
    }

    const description = String(form.get("description") || "").trim()
    if (!description) {
      toast.error("Informe a descrição da preventiva")
      return
    }

    const input: PreventiveInput = {
      vehicleId: selected.id,
      description,
      intervalKm: Number(form.get("intervalKm") || 0),
      lastKm: Number(form.get("lastKm") || selected.currentKm),
    }

    startTransition(async () => {
      try {
        await createPreventive(input)
        toast.success("Preventiva agendada com sucesso")
        onOpenChange(false)
        onSaved()
      } catch {
        toast.error("Erro ao agendar a preventiva")
      }
    })
  }

  const selected = vehicles.find((v) => String(v.id) === vehicleId)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Nova Preventiva</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="grid gap-4">
          <div className="grid gap-1.5">
            <Label htmlFor="vehicle">Veículo</Label>
            <Select value={vehicleId} onValueChange={setVehicleId}>
              <SelectTrigger id="vehicle">
                <SelectValue placeholder="Selecione o veículo" />
              </SelectTrigger>
              <SelectContent>
                {vehicles.map((v) => (
                  <SelectItem key={v.id} value={String(v.id)}>
                    {v.plate} — {v.model || v.brand || "Veículo"} ({v.currentKm.toLocaleString("pt-BR")} km)
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-1.5">
            <Label htmlFor="description">Descrição</Label>
            <Input
              id="description"
              name="description"
              placeholder="Troca de óleo e filtros"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-1.5">
              <Label htmlFor="lastKm">KM da última</Label>
              <Input
                id="lastKm"
                name="lastKm"
                type="number"
                min={0}
                placeholder="0"
                defaultValue={selected?.currentKm ?? 0}
                key={vehicleId}
              />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="intervalKm">Intervalo (km)</Label>
              <Input
                id="intervalKm"
                name="intervalKm"
                type="number"
                min={0}
                placeholder="10000"
              />
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isPending}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? "Salvando..." : "Agendar"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
