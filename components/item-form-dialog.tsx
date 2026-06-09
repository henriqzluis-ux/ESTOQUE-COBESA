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
import { createItem, updateItem, type ItemInput } from "@/app/actions/inventory"
import type { InventoryItem } from "@/lib/db/schema"
import { useState, useTransition } from "react"
import { toast } from "sonner"

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  item?: InventoryItem | null
  onSaved: () => void
}

export function ItemFormDialog({ open, onOpenChange, item, onSaved }: Props) {
  const [isPending, startTransition] = useTransition()

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const form = new FormData(e.currentTarget)
    const input: ItemInput = {
      name: String(form.get("name") || "").trim(),
      reference: String(form.get("reference") || "").trim(),
      category: String(form.get("category") || "").trim(),
      manufacturer: String(form.get("manufacturer") || "").trim(),
      quantity: Number(form.get("quantity") || 0),
      minQuantity: Number(form.get("minQuantity") || 0),
      unitPrice: Number(form.get("unitPrice") || 0),
      location: String(form.get("location") || "").trim(),
    }

    if (!input.name) {
      toast.error("Informe o nome do item")
      return
    }

    startTransition(async () => {
      try {
        if (item) {
          await updateItem(item.id, input)
          toast.success("Item atualizado com sucesso")
        } else {
          await createItem(input)
          toast.success("Item cadastrado com sucesso")
        }
        onOpenChange(false)
        onSaved()
      } catch {
        toast.error("Erro ao salvar o item")
      }
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{item ? "Editar Item" : "Novo Item"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="grid gap-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-1.5">
              <Label htmlFor="name">Nome</Label>
              <Input
                id="name"
                name="name"
                placeholder="Filtro de óleo"
                defaultValue={item?.name ?? ""}
                required
              />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="reference">Referência</Label>
              <Input
                id="reference"
                name="reference"
                placeholder="FLT-001"
                defaultValue={item?.reference ?? ""}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-1.5">
              <Label htmlFor="category">Categoria</Label>
              <Input
                id="category"
                name="category"
                placeholder="Filtros"
                defaultValue={item?.category ?? ""}
              />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="manufacturer">Fabricante</Label>
              <Input
                id="manufacturer"
                name="manufacturer"
                placeholder="MANN"
                defaultValue={item?.manufacturer ?? ""}
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="grid gap-1.5">
              <Label htmlFor="quantity">Quantidade</Label>
              <Input
                id="quantity"
                name="quantity"
                type="number"
                min={0}
                placeholder="0"
                defaultValue={item?.quantity ?? 0}
              />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="minQuantity">Qtd. Mínima</Label>
              <Input
                id="minQuantity"
                name="minQuantity"
                type="number"
                min={0}
                placeholder="0"
                defaultValue={item?.minQuantity ?? 0}
              />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="unitPrice">Preço Unit.</Label>
              <Input
                id="unitPrice"
                name="unitPrice"
                type="number"
                min={0}
                step="0.01"
                placeholder="0"
                defaultValue={item?.unitPrice ?? 0}
              />
            </div>
          </div>

          <div className="grid gap-1.5">
            <Label htmlFor="location">Localização</Label>
            <Input
              id="location"
              name="location"
              placeholder="Prateleira A-01"
              defaultValue={item?.location ?? ""}
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
              {isPending ? "Salvando..." : item ? "Salvar" : "Cadastrar"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
