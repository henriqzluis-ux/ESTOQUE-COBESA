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
import { createVehicle, updateVehicle, type VehicleInput } from "@/app/actions/fleet"
import type { Vehicle } from "@/lib/db/schema"
import { useState, useTransition } from "react"
import { toast } from "sonner"

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  vehicle?: Vehicle | null
  onSaved: () => void
}

export function VehicleFormDialog({ open, onOpenChange, vehicle, onSaved }: Props) {
  const [isPending, startTransition] = useTransition()
  const [status, setStatus] = useState(vehicle?.status ?? "ativo")

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const form = new FormData(e.currentTarget)
    const input: VehicleInput = {
      plate: String(form.get("plate") || "").trim(),
      model: String(form.get("model") || "").trim(),
      brand: String(form.get("brand") || "").trim(),
      type: String(form.get("type") || "").trim(),
      currentKm: Number(form.get("currentKm") || 0),
      status,
    }

    if (!input.plate) {
      toast.error("Informe a placa do veículo")
      return
    }

    startTransition(async () => {
      try {
        if (vehicle) {
          await updateVehicle(vehicle.id, input)
          toast.success("Veículo atualizado com sucesso")
        } else {
          await createVehicle(input)
          toast.success("Veículo cadastrado com sucesso")
        }
        onOpenChange(false)
        onSaved()
      } catch {
        toast.error("Erro ao salvar o veículo")
      }
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{vehicle ? "Editar Veículo" : "Novo Veículo"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="grid gap-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-1.5">
              <Label htmlFor="plate">Placa</Label>
              <Input
                id="plate"
                name="plate"
                placeholder="ABC-1D23"
                defaultValue={vehicle?.plate ?? ""}
                required
              />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="type">Tipo</Label>
              <Input
                id="type"
                name="type"
                placeholder="Caminhão, Van..."
                defaultValue={vehicle?.type ?? ""}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-1.5">
              <Label htmlFor="brand">Marca</Label>
              <Input
                id="brand"
                name="brand"
                placeholder="Mercedes-Benz"
                defaultValue={vehicle?.brand ?? ""}
              />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="model">Modelo</Label>
              <Input
                id="model"
                name="model"
                placeholder="Accelo 1016"
                defaultValue={vehicle?.model ?? ""}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-1.5">
              <Label htmlFor="currentKm">KM Atual</Label>
              <Input
                id="currentKm"
                name="currentKm"
                type="number"
                min={0}
                placeholder="0"
                defaultValue={vehicle?.currentKm ?? 0}
              />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="status">Status</Label>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger id="status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ativo">Ativo</SelectItem>
                  <SelectItem value="manutencao">Em manutenção</SelectItem>
                  <SelectItem value="inativo">Inativo</SelectItem>
                </SelectContent>
              </Select>
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
              {isPending ? "Salvando..." : vehicle ? "Salvar" : "Cadastrar"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
