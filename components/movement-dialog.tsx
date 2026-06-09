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
import { registerMovement } from "@/app/actions/inventory"
import type { InventoryItem } from "@/lib/db/schema"
import { useTransition } from "react"
import { toast } from "sonner"

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

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!item) return
    const form = new FormData(e.currentTarget)
    const quantity = Number(form.get("quantity") || 0)
    const note = String(form.get("note") || "").trim()

    if (quantity <= 0) {
      toast.error("Informe uma quantidade válida")
      return
    }

    startTransition(async () => {
      try {
        await registerMovement(item.id, type, quantity, note)
        toast.success(
          type === "entrada"
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

  const isEntrada = type === "entrada"

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
                name="quantity"
                type="number"
                min={1}
                placeholder="0"
                autoFocus
              />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="note">Observação (opcional)</Label>
              <Input
                id="note"
                name="note"
                placeholder={isEntrada ? "Nota fiscal, fornecedor..." : "Veículo, OS..."}
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
