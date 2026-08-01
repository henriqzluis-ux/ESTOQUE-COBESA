"use client"

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  getActiveVehicles,
  getWithdrawalsByVehicle,
} from "@/app/actions/withdrawals"
import { PackageMinus, Truck } from "lucide-react"
import { useCallback, useEffect, useState } from "react"
import { PageHeader } from "./page-header"

type VehicleOption = {
  id: number
  plate: string
  model: string | null
  brand: string | null
}

type Withdrawal = {
  id: number
  itemId: number
  itemName: string | null
  itemReference: string | null
  quantity: number
  unitPrice: string | null
  note: string | null
  createdAt: Date | string
}

function formatCurrency(value: number) {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })
}

function formatDateTime(date: Date | string) {
  return new Date(date).toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
}

export function WithdrawalsView() {
  const [vehicles, setVehicles] = useState<VehicleOption[]>([])
  const [selected, setSelected] = useState<string>("")
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([])
  const [loadingVehicles, setLoadingVehicles] = useState(true)
  const [loadingItems, setLoadingItems] = useState(false)

  useEffect(() => {
    getActiveVehicles()
      .then((list) => {
        setVehicles(list)
        setLoadingVehicles(false)
      })
      .catch(() => setLoadingVehicles(false))
  }, [])

  const load = useCallback(async (vehicleId: number) => {
    setLoadingItems(true)
    try {
      const rows = await getWithdrawalsByVehicle(vehicleId)
      setWithdrawals(rows)
    } finally {
      setLoadingItems(false)
    }
  }, [])

  useEffect(() => {
    if (selected) load(Number(selected))
    else setWithdrawals([])
  }, [selected, load])

  const selectedVehicle = vehicles.find((v) => String(v.id) === selected)
  const totalUnits = withdrawals.reduce((sum, w) => sum + w.quantity, 0)
  const totalValue = withdrawals.reduce(
    (sum, w) => sum + w.quantity * Number(w.unitPrice ?? 0),
    0,
  )

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Retiradas por Veículo"
        description="Todos os itens retirados do estoque para cada veículo da frota"
      />

      <div className="rounded-xl border border-border bg-card p-4">
        <label className="mb-1.5 block text-sm font-medium text-foreground">
          Filtrar por veículo
        </label>
        <div className="sm:max-w-sm">
          <Select value={selected} onValueChange={(v) => setSelected(v ?? "")}>
            <SelectTrigger>
              <SelectValue
                placeholder={
                  loadingVehicles ? "Carregando..." : "Selecione um veículo"
                }
              >
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
      </div>

      {!selected ? (
        <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed border-border bg-card p-16 text-center">
          <Truck className="h-10 w-10 text-muted-foreground/40" />
          <p className="font-medium text-foreground">
            Selecione um veículo
          </p>
          <p className="text-sm text-muted-foreground">
            Escolha um veículo acima para ver todos os itens retirados do estoque
            para ele.
          </p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-3">
            <div className="rounded-xl border border-border bg-card p-4">
              <p className="text-xs text-muted-foreground">Retiradas</p>
              <p className="text-xl font-bold text-foreground">
                {withdrawals.length}
              </p>
            </div>
            <div className="rounded-xl border border-border bg-card p-4">
              <p className="text-xs text-muted-foreground">Total de unidades</p>
              <p className="text-xl font-bold text-foreground">{totalUnits}</p>
            </div>
            <div className="rounded-xl border border-border bg-card p-4">
              <p className="text-xs text-muted-foreground">Valor total</p>
              <p className="text-xl font-bold text-foreground">
                {formatCurrency(totalValue)}
              </p>
            </div>
          </div>

          <div className="rounded-xl border border-border bg-card">
            <div className="border-b border-border px-4 py-3">
              <p className="text-sm font-medium text-foreground">
                {selectedVehicle
                  ? `${selectedVehicle.plate}${selectedVehicle.model ? ` — ${selectedVehicle.model}` : ""}`
                  : "Veículo"}
              </p>
            </div>

            {loadingItems ? (
              <div className="p-12 text-center text-sm text-muted-foreground">
                Carregando...
              </div>
            ) : withdrawals.length === 0 ? (
              <div className="flex flex-col items-center gap-2 p-16 text-center">
                <PackageMinus className="h-10 w-10 text-muted-foreground/40" />
                <p className="font-medium text-foreground">
                  Nenhuma retirada para este veículo
                </p>
                <p className="text-sm text-muted-foreground">
                  Registre uma saída no Almoxarifado e selecione este veículo.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted-foreground">
                      <th className="px-4 py-3 font-medium">Data</th>
                      <th className="px-4 py-3 font-medium">Item</th>
                      <th className="px-4 py-3 font-medium">Referência</th>
                      <th className="px-4 py-3 font-medium">Observação</th>
                      <th className="px-4 py-3 text-right font-medium">Qtd.</th>
                      <th className="px-4 py-3 text-right font-medium">Valor</th>
                    </tr>
                  </thead>
                  <tbody>
                    {withdrawals.map((w) => (
                      <tr
                        key={w.id}
                        className="border-b border-border last:border-0 hover:bg-muted/40"
                      >
                        <td className="px-4 py-3 text-muted-foreground">
                          {formatDateTime(w.createdAt)}
                        </td>
                        <td className="px-4 py-3 font-medium text-foreground">
                          {w.itemName || "Item removido"}
                        </td>
                        <td className="px-4 py-3 text-muted-foreground">
                          {w.itemReference || "—"}
                        </td>
                        <td className="px-4 py-3 text-muted-foreground">
                          {w.note || "—"}
                        </td>
                        <td className="px-4 py-3 text-right font-semibold text-foreground">
                          {w.quantity}
                        </td>
                        <td className="px-4 py-3 text-right text-foreground">
                          {formatCurrency(w.quantity * Number(w.unitPrice ?? 0))}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}
