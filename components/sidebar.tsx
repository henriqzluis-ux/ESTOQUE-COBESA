"use client"

import { cn } from "@/lib/utils"
import {
  Boxes,
  LayoutDashboard,
  Truck,
  FileText,
  Wrench,
  CalendarCheck,
  ClipboardList,
  Brain,
} from "lucide-react"

export type ViewKey =
  | "visao-geral"
  | "frota"
  | "almoxarifado"
  | "relatorios"
  | "servicos"
  | "preventivas"
  | "conferencia"
  | "analise-ia"

const navItems: { key: ViewKey; label: string; icon: typeof Boxes }[] = [
  { key: "visao-geral", label: "Visão Geral", icon: LayoutDashboard },
  { key: "frota", label: "Minha Frota", icon: Truck },
  { key: "almoxarifado", label: "Almoxarifado", icon: Boxes },
  { key: "relatorios", label: "Relatórios", icon: FileText },
  { key: "servicos", label: "Serviços", icon: Wrench },
  { key: "preventivas", label: "Preventivas", icon: CalendarCheck },
  { key: "conferencia", label: "Conferência Semanal", icon: ClipboardList },
  { key: "analise-ia", label: "Análise IA", icon: Brain },
]

type Props = {
  active: ViewKey
  onNavigate: (view: ViewKey) => void
}

export function Sidebar({ active, onNavigate }: Props) {
  return (
    <aside className="flex h-dvh w-64 shrink-0 flex-col bg-sidebar text-sidebar-foreground">
      <div className="flex items-center gap-3 px-6 py-6">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sidebar-primary">
          <Boxes className="h-5 w-5 text-sidebar-primary-foreground" />
        </div>
        <div className="leading-tight">
          <p className="text-lg font-bold tracking-tight">COBESA</p>
          <p className="text-xs text-sidebar-foreground/60">PEÇAS</p>
        </div>
      </div>

      <nav className="flex flex-1 flex-col gap-1 px-3 py-2">
        {navItems.map((item) => {
          const Icon = item.icon
          const isActive = item.key === active
          return (
            <button
              key={item.key}
              type="button"
              onClick={() => onNavigate(item.key)}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                isActive
                  ? "bg-sidebar-primary text-sidebar-primary-foreground"
                  : "text-sidebar-foreground/70 hover:bg-sidebar-accent/20 hover:text-sidebar-foreground",
              )}
              aria-current={isActive ? "page" : undefined}
            >
              <Icon className="h-[18px] w-[18px]" />
              {item.label}
            </button>
          )
        })}
      </nav>

      <div className="flex items-center gap-3 border-t border-sidebar-border px-6 py-4">
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-sidebar-primary text-xs font-bold text-sidebar-primary-foreground">
          ADM
        </div>
        <div className="leading-tight">
          <p className="text-sm font-medium">Operador</p>
          <p className="text-xs text-sidebar-foreground/60">Sistema COBESA</p>
        </div>
      </div>
    </aside>
  )
}
