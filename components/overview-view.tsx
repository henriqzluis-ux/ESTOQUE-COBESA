"use client"

import { getDashboardData, type DashboardData } from "@/app/actions/dashboard"
import type { ViewKey } from "@/components/sidebar"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"
import {
  AlertTriangle,
  DollarSign,
  Package,
  Truck,
  Wrench,
} from "lucide-react"
import { useEffect, useState } from "react"
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  XAxis,
  YAxis,
} from "recharts"
import { PageHeader, StatusBadge } from "./page-header"

function formatCurrency(value: number) {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })
}

const PIE_COLORS = [
  "var(--chart-1)",
  "var(--chart-2)",
  "var(--chart-3)",
  "var(--chart-4)",
  "var(--chart-5)",
]

export function OverviewView({ onNavigate }: { onNavigate: (v: ViewKey) => void }) {
  const [data, setData] = useState<DashboardData | null>(null)

  useEffect(() => {
    getDashboardData().then(setData)
  }, [])

  const cards = [
    {
      label: "FROTA ATIVA",
      value: data ? `${data.fleet.active}/${data.fleet.total}` : "—",
      sub: "Veículos operando",
      icon: Truck,
    },
    {
      label: "PATRIMÔNIO EM PEÇAS",
      value: data ? formatCurrency(data.inventory.totalValue) : "—",
      sub: data ? `${data.inventory.skus} SKUs no almoxarifado` : "",
      icon: Package,
    },
    {
      label: "CUSTO MANUTENÇÃO",
      value: data ? formatCurrency(data.services.totalCost) : "—",
      sub: data ? `${data.services.count} serviços realizados` : "",
      icon: DollarSign,
    },
    {
      label: "ESTOQUE CRÍTICO",
      value: data ? String(data.inventory.lowStock) : "—",
      sub: "Itens abaixo do mínimo",
      icon: AlertTriangle,
      alert: true,
    },
  ]

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Painel de Controle"
        description="Visão geral da operação COBESA Peças"
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((card) => {
          const Icon = card.icon
          return (
            <div key={card.label} className="rounded-xl border border-border bg-card p-4">
              <div className="flex items-center justify-between">
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  {card.label}
                </p>
                <div
                  className={`flex h-9 w-9 items-center justify-center rounded-lg ${
                    card.alert ? "bg-destructive/10 text-destructive" : "bg-primary/10 text-primary"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                </div>
              </div>
              <p className="mt-3 text-2xl font-bold text-foreground">{card.value}</p>
              <p className="text-xs text-muted-foreground">{card.sub}</p>
            </div>
          )
        })}
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="rounded-xl border border-border bg-card p-4 lg:col-span-2">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-foreground">
            Custo operacional (6 meses)
          </h3>
          {data && (
            <ChartContainer
              config={{ total: { label: "Custo", color: "var(--chart-1)" } }}
              className="mt-4 h-[240px] w-full"
            >
              <BarChart data={data.costByMonth}>
                <CartesianGrid vertical={false} strokeDasharray="3 3" />
                <XAxis dataKey="month" tickLine={false} axisLine={false} tickMargin={8} />
                <YAxis
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(v) => `R$${(v / 1000).toFixed(0)}k`}
                />
                <ChartTooltip
                  content={<ChartTooltipContent formatter={(v) => formatCurrency(Number(v))} />}
                />
                <Bar dataKey="total" fill="var(--color-total)" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ChartContainer>
          )}
        </div>

        <div className="rounded-xl border border-border bg-card p-4">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-foreground">
            Mix de estoque
          </h3>
          {data && data.stockMix.length > 0 ? (
            <ChartContainer config={{}} className="mt-4 h-[240px] w-full">
              <PieChart>
                <ChartTooltip
                  content={<ChartTooltipContent formatter={(v) => formatCurrency(Number(v))} />}
                />
                <Pie
                  data={data.stockMix}
                  dataKey="value"
                  nameKey="category"
                  innerRadius={45}
                  outerRadius={80}
                >
                  {data.stockMix.map((_, i) => (
                    <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                  ))}
                </Pie>
              </PieChart>
            </ChartContainer>
          ) : (
            <div className="flex h-[240px] items-center justify-center text-sm text-muted-foreground">
              Sem dados
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="rounded-xl border border-border bg-card p-4">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-foreground">
            Reposição necessária
          </h3>
          {data && data.reposition.length > 0 ? (
            <ul className="mt-3 flex flex-col divide-y divide-border">
              {data.reposition.map((r) => (
                <li key={r.id} className="flex items-center justify-between py-2.5 text-sm">
                  <span className="font-medium text-foreground">{r.name}</span>
                  <StatusBadge
                    label={`${r.quantity} / mín ${r.minQuantity}`}
                    tone="danger"
                  />
                </li>
              ))}
            </ul>
          ) : (
            <div className="flex h-32 flex-col items-center justify-center gap-1 text-center">
              <p className="text-sm font-medium text-primary">Estoque saudável</p>
              <p className="text-xs text-muted-foreground">Nenhum item abaixo do mínimo</p>
            </div>
          )}
        </div>

        <div className="rounded-xl border border-border bg-card p-4">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-foreground">
            Últimas manutenções
          </h3>
          {data && data.lastServices.length > 0 ? (
            <ul className="mt-3 flex flex-col divide-y divide-border">
              {data.lastServices.map((s) => (
                <li key={s.id} className="flex items-center justify-between py-2.5 text-sm">
                  <div className="flex items-center gap-2">
                    <Wrench className="h-4 w-4 text-muted-foreground" />
                    <div className="leading-tight">
                      <p className="font-medium text-foreground">{s.vehiclePlate || "—"}</p>
                      <p className="text-xs text-muted-foreground">{s.serviceType}</p>
                    </div>
                  </div>
                  <span className="text-foreground">{formatCurrency(Number(s.cost))}</span>
                </li>
              ))}
            </ul>
          ) : (
            <div className="flex h-32 items-center justify-center text-sm text-muted-foreground">
              Nenhum serviço registrado
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
