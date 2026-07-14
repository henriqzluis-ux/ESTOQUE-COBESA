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
  createVehicle,
  updateVehicle,
  type VehicleInput,
} from "@/app/actions/fleet"
import type { Vehicle } from "@/lib/db/schema"
import { useTransition } from "react"
import { toast } from "sonner"

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  vehicle?: Vehicle | null
  onSaved: () => void
}

export function VehicleFormDialog({
  open,
  onOpenChange,
  vehicle,
  onSaved,
}: Props) {
  const [isPending, startTransition] = useTransition()

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const form = new FormData(e.currentTarget)
    const input: VehicleInput = {
      plate: String(form.get("plate") || "").trim(),
      type: String(form.get("type") || "Caminhão"),
      model: String(form.get("model") || "").trim(),
      brand: String(form.get("brand") || "").trim(),
      initialKm: Number(form.get("initialKm") || 0),
    }

    if (!input.plate) {
      toast.error("Informe a placa do veículo")
      return
    }
    if (!input.model) {
      toast.error("Informe o modelo / versão")
      return
    }

    startTransition(async () => {
      try {
        if (vehicle) {
          await updateVehicle(vehicle.id, {
            ...input,
            currentKm: Math.max(input.initialKm ?? 0, vehicle.currentKm),
            status: vehicle.status,
          })
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
          <DialogTitle>
            {vehicle ? "Editar Veículo" : "Registrar Frota"}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="grid gap-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-1.5">
              <Label htmlFor="plate">Placa</Label>
              <Input
                id="plate"
                name="plate"
                placeholder="AAA-0000"
                defaultValue={vehicle?.plate ?? ""}
                required
              />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="type">Tipo</Label>
              <select
                id="type"
                name="type"
                defaultValue={vehicle?.type ?? "Caminhão"}
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm outline-none focus-visible:ring-1 focus-visible:ring-ring"
              >
                <option value="Caminhão">Caminhão</option>
                <option value="Carreta">Carreta</option>
              </select>
            </div>
          </div>

          <div className="grid gap-1.5">
            <Label htmlFor="model">Modelo / Versão</Label>
            <Input
              id="model"
              name="model"
              placeholder="Ex: Volvo FH 540"
              defaultValue={vehicle?.model ?? ""}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-1.5">
              <Label htmlFor="brand">Marca</Label>
              <Input
                id="brand"
                name="brand"
                placeholder="Volvo"
                defaultValue={vehicle?.brand ?? ""}
              />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="initialKm">KM Inicial</Label>
              <Input
                id="initialKm"
                name="initialKm"
                type="number"
                min={0}
                placeholder="0"
                defaultValue={vehicle?.initialKm ?? 0}
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
              {isPending
                ? "Salvando..."
                : vehicle
                  ? "Salvar"
                  : "Confirmar Cadastro"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
