"use client"

import { Button } from "@/components/ui/button"
import { getDashboardData, type DashboardData } from "@/app/actions/dashboard"
import { getVehicles } from "@/app/actions/fleet"
import { getItems, getMovements } from "@/app/actions/inventory"
import { getServices } from "@/app/actions/services"
import { Download, FileText } from "lucide-react"
import { useEffect, useState } from "react"
import { toast } from "sonner"
import { PageHeader } from "./page-header"

function formatCurrency(value: number) {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })
}

function toCsv(rows: Record<string, unknown>[]): string {
  if (rows.length === 0) return ""
  const headers = Object.keys(rows[0])
  const escape = (val: unknown) => {
    const s = val === null || val === undefined ? "" : String(val)
    return `"${s.replace(/"/g, '""')}"`
  }
  const lines = [
    headers.join(";"),
    ...rows.map((r) => headers.map((h) => escape(r[h])).join(";")),
  ]
  return "\uFEFF" + lines.join("\n")
}

function download(filename: string, content: string) {
  const blob = new Blob([content], { type: "text/csv;charset=utf-8;" })
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

export function ReportsView() {
  const [data, setData] = useState<DashboardData | null>(null)
  const [exporting, setExporting] = useState<string | null>(null)

  useEffect(() => {
    getDashboardData().then(setData)
  }, [])

  async function exportFleet() {
    setExporting("frota")
    try {
      const rows = await getVehicles()
      if (rows.length === 0) return toast.error("Nenhum veículo para exportar")
      download(
        "frota.csv",
        toCsv(
          rows.map((v) => ({
            Placa: v.plate,
            Marca: v.brand,
            Modelo: v.model,
            Tipo: v.type,
            KM: v.currentKm,
            Status: v.status,
          })),
        ),
      )
      toast.success("Relatório de frota exportado")
    } finally {
      setExporting(null)
    }
  }

  async function exportStock() {
    setExporting("estoque")
    try {
      const rows = await getItems()
      if (rows.length === 0) return toast.error("Nenhum item para exportar")
      download(
        "estoque.csv",
        toCsv(
          rows.map((i) => ({
            Nome: i.name,
            Referencia: i.reference,
            Categoria: i.category,
            Fabricante: i.manufacturer,
            Quantidade: i.quantity,
            Minimo: i.minQuantity,
            PrecoUnitario: i.unitPrice,
            Localizacao: i.location,
          })),
        ),
      )
      toast.success("Relatório de estoque exportado")
    } finally {
      setExporting(null)
    }
  }

  async function exportServices() {
    setExporting("servicos")
    try {
      const rows = await getServices()
      if (rows.length === 0) return toast.error("Nenhum serviço para exportar")
      download(
        "servicos.csv",
        toCsv(
          rows.map((s) => ({
            Data: new Date(s.serviceDate).toLocaleDateString("pt-BR"),
            Veiculo: s.vehiclePlate,
            Tipo: s.serviceType,
            Descricao: s.description,
            KM: s.km,
            Custo: s.cost,
            Fornecedor: s.provider,
          })),
        ),
      )
      toast.success("Relatório de serviços exportado")
    } finally {
      setExporting(null)
    }
  }

  async function exportMovements() {
    setExporting("mov")
    try {
      const rows = await getMovements()
      if (rows.length === 0) return toast.error("Nenhuma movimentação para exportar")
      download(
        "movimentacoes.csv",
        toCsv(
          rows.map((m) => ({
            Data: new Date(m.createdAt).toLocaleDateString("pt-BR"),
            Item: m.itemName,
            Tipo: m.type,
            Quantidade: m.quantity,
            Observacao: m.note,
          })),
        ),
      )
      toast.success("Relatório de movimentações exportado")
    } finally {
      setExporting(null)
    }
  }

  const summary = [
    {
      value: data ? `${data.fleet.total}` : "—",
      label: data ? `Veículos (${data.fleet.active} ativos)` : "Veículos",
    },
    { value: data ? `${data.inventory.skus}` : "—", label: "Itens em estoque" },
    { value: data ? `${data.services.count}` : "—", label: "Serviços realizados" },
    {
      value: data ? formatCurrency(data.services.totalCost) : "—",
      label: "Custo total serviços",
    },
  ]

  const exports = [
    { key: "frota", label: "Exportar Frota", fn: exportFleet },
    { key: "estoque", label: "Exportar Estoque", fn: exportStock },
    { key: "servicos", label: "Exportar Serviços", fn: exportServices },
    { key: "mov", label: "Exportar Movimentações", fn: exportMovements },
  ]

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Relatórios" description="Resumo e exportação de dados da operação" />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {summary.map((s) => (
          <div key={s.label} className="rounded-xl border border-border bg-card p-4">
            <p className="text-2xl font-bold text-foreground">{s.value}</p>
            <p className="text-xs text-muted-foreground">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="rounded-xl border border-border bg-card p-6">
        <div className="flex items-center gap-2">
          <FileText className="h-5 w-5 text-primary" />
          <h3 className="text-sm font-semibold uppercase tracking-wide text-foreground">
            Exportar Relatórios
          </h3>
        </div>
        <p className="mt-1 text-sm text-muted-foreground">
          Baixe os dados em formato CSV (compatível com Excel).
        </p>
        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {exports.map((e) => (
            <Button
              key={e.key}
              variant="outline"
              className="justify-start"
              onClick={e.fn}
              disabled={exporting !== null}
            >
              <Download className="h-4 w-4" />
              {exporting === e.key ? "Exportando..." : e.label}
            </Button>
          ))}
        </div>
      </div>
    </div>
  )
}
