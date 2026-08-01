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
import { registerMovement } from "@/app/actions/inventory"
import { getActiveVehicles } from "@/app/actions/withdrawals"
import type { InventoryItem } from "@/lib/db/schema"
import { useEffect, useState, useTransition } from "react"
import { toast } from "sonner"

type VehicleOption = {
  id: number
  plate: string
  model: string | null
  brand: string | null
}

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  type: "entrada" | "saida"
  item: InventoryItem | null
  onSaved: () => void
}

export function MovementDialog({
  open,
  onOpenChange,
  type,
  item,
  onSaved,
}: Props) {
  const [isPending, startTransition] = useTransition()
  const [vehicles, setVehicles] = useState<VehicleOption[]>([])
  const [vehicleId, setVehicleId] = useState<string>("")
  const [quantity, setQuantity] = useState("")
  const [note, setNote] = useState("")

  const isEntrada = type === "entrada"

  useEffect(() => {
    if (open && !isEntrada) {
      getActiveVehicles()
        .then(setVehicles)
        .catch(() => setVehicles([]))
    }
  }, [open, isEntrada])

  useEffect(() => {
    if (open) {
      setVehicleId("")
      setQuantity("")
      setNote("")
    }
  }, [open])

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!item) return
    const qty = Number(quantity || 0)

    if (qty <= 0) {
      toast.error("Informe uma quantidade válida")
      return
    }

    const selected = vehicles.find((v) => String(v.id) === vehicleId)

    startTransition(async () => {
      try {
        await registerMovement(
          item.id,
          type,
          qty,
          note.trim() || undefined,
          selected ? selected.id : null,
          selected ? selected.plate : null,
        )
        toast.success(
          isEntrada
            ? "Entrada registrada com sucesso"
            : "Saída registrada com sucesso",
        )
        onOpenChange(false)
        onSaved()
      } catch (err) {
        toast.error(
          err instanceof Error ? err.message : "Erro ao registrar movimentação",
        )
      }
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>
            {isEntrada ? "Registrar Entrada" : "Registrar Saída"}
          </DialogTitle>
        </DialogHeader>
        {item && (
          <form onSubmit={handleSubmit} className="grid gap-4">
            <div className="rounded-lg bg-muted px-3 py-2.5 text-sm">
              <p className="font-medium text-foreground">{item.name}</p>
              <p className="text-muted-foreground">
                Estoque atual: {item.quantity} un.
              </p>
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="quantity">Quantidade</Label>
              <Input
                id="quantity"
                type="number"
                min={1}
                placeholder="0"
                autoFocus
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
              />
            </div>
            {!isEntrada && (
              <div className="grid gap-1.5">
                <Label>Veículo (opcional)</Label>
                <Select
                  value={vehicleId}
                  onValueChange={(v) => setVehicleId(v ?? "")}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o veículo">
                      {(value: string) => {
                        const v = vehicles.find((x) => String(x.id) === value)
                        return v ? `${v.plate}${v.model ? ` — ${v.model}` : ""}` : ""
                      }}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {vehicles.length === 0 ? (
                      <SelectItem value="__none" disabled>
                        Nenhum veículo cadastrado
                      </SelectItem>
                    ) : (
                      vehicles.map((v) => (
                        <SelectItem key={v.id} value={String(v.id)}>
                          {v.plate}
                          {v.model ? ` — ${v.model}` : ""}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>
            )}
            <div className="grid gap-1.5">
              <Label htmlFor="note">Observação (opcional)</Label>
              <Input
                id="note"
                placeholder={isEntrada ? "Nota fiscal, fornecedor..." : "OS, responsável..."}
                value={note}
                onChange={(e) => setNote(e.target.value)}
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
                {isPending ? "Registrando..." : "Confirmar"}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  )
}
