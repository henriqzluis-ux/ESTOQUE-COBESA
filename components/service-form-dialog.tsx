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
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { createService, type ServiceInput } from "@/app/actions/services"
import type { Vehicle } from "@/lib/db/schema"
import { useState, useTransition } from "react"
import { toast } from "sonner"

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  vehicles: Vehicle[]
  onSaved: () => void
}

const serviceTypes = [
  "Preventiva",
  "Corretiva",
  "Troca de óleo",
  "Troca de pneus",
  "Freios",
  "Suspensão",
  "Elétrica",
  "Funilaria",
  "Outros",
]

export function ServiceFormDialog({ open, onOpenChange, vehicles, onSaved }: Props) {
  const [isPending, startTransition] = useTransition()
  const [vehicleId, setVehicleId] = useState<string>("")
  const [serviceType, setServiceType] = useState<string>("Preventiva")

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const form = new FormData(e.currentTarget)
    const selected = vehicles.find((v) => String(v.id) === vehicleId)

    const input: ServiceInput = {
      vehicleId: selected ? selected.id : null,
      vehiclePlate: selected ? selected.plate : "",
      serviceType,
      description: String(form.get("description") || "").trim(),
      km: Number(form.get("km") || 0),
      cost: Number(form.get("cost") || 0),
      provider: String(form.get("provider") || "").trim(),
      serviceDate: String(form.get("serviceDate") || ""),
    }

    if (!selected) {
      toast.error("Selecione um veículo")
      return
    }

    startTransition(async () => {
      try {
        await createService(input)
        toast.success("Serviço registrado com sucesso")
        onOpenChange(false)
        onSaved()
      } catch {
        toast.error("Erro ao registrar o serviço")
      }
    })
  }

  const today = new Date().toISOString().slice(0, 10)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Registrar Serviço</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="grid gap-4">
          <div className="grid gap-1.5">
            <Label htmlFor="vehicle">Veículo</Label>
            <Select value={vehicleId} onValueChange={(v) => setVehicleId(v ?? "")}>
              <SelectTrigger id="vehicle">
                <SelectValue placeholder="Selecione o veículo" />
              </SelectTrigger>
              <SelectContent>
                {vehicles.map((v) => (
                  <SelectItem key={v.id} value={String(v.id)}>
                    {v.plate} — {v.model || v.brand || "Veículo"}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-1.5">
              <Label htmlFor="serviceType">Tipo</Label>
              <Select value={serviceType} onValueChange={(v) => setServiceType(v ?? "")}>
                <SelectTrigger id="serviceType">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {serviceTypes.map((t) => (
                    <SelectItem key={t} value={t}>
                      {t}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="serviceDate">Data</Label>
              <Input
                id="serviceDate"
                name="serviceDate"
                type="date"
                defaultValue={today}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-1.5">
              <Label htmlFor="km">KM</Label>
              <Input id="km" name="km" type="number" min={0} placeholder="0" />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="cost">Custo (R$)</Label>
              <Input id="cost" name="cost" type="number" min={0} step="0.01" placeholder="0,00" />
            </div>
          </div>

          <div className="grid gap-1.5">
            <Label htmlFor="provider">Fornecedor / Oficina</Label>
            <Input id="provider" name="provider" placeholder="Oficina Central" />
          </div>

          <div className="grid gap-1.5">
            <Label htmlFor="description">Descrição</Label>
            <Textarea
              id="description"
              name="description"
              placeholder="Peças trocadas, observações..."
              rows={3}
            />
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
              {isPending ? "Registrando..." : "Registrar"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
