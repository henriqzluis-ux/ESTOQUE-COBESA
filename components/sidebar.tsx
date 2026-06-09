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

const navItems = [
  { label: "Visão Geral", icon: LayoutDashboard, active: false },
  { label: "Minha Frota", icon: Truck, active: false },
  { label: "Almoxarifado", icon: Boxes, active: true },
  { label: "Relatórios", icon: FileText, active: false },
  { label: "Serviços", icon: Wrench, active: false },
  { label: "Preventivas", icon: CalendarCheck, active: false },
  { label: "Conferência Semanal", icon: ClipboardList, active: false },
  { label: "Análise IA", icon: Brain, active: false },
]

export function Sidebar() {
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
          return (
            <button
              key={item.label}
              type="button"
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                item.active
                  ? "bg-sidebar-primary text-sidebar-primary-foreground"
                  : "text-sidebar-foreground/70 hover:bg-sidebar-accent/20 hover:text-sidebar-foreground",
              )}
              aria-current={item.active ? "page" : undefined}
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
