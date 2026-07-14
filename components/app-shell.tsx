"use client"

import { useState } from "react"
import { Sidebar, type ViewKey } from "@/components/sidebar"
import { InventoryView } from "@/components/inventory-view"
import { FleetView } from "@/components/fleet-view"
import { Construction } from "lucide-react"

const titles: Record<ViewKey, string> = {
  overview: "Visão Geral",
  fleet: "Minha Frota",
  inventory: "Almoxarifado",
  reports: "Relatórios",
  services: "Serviços",
  preventive: "Preventivas",
  weekly: "Conferência Semanal",
  ai: "Análise IA",
}

function ComingSoon({ view }: { view: ViewKey }) {
  return (
    <div className="flex flex-col gap-6">
      <header>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          {titles[view]}
        </h1>
        <p className="text-sm text-muted-foreground">
          Este módulo estará disponível em breve
        </p>
      </header>
      <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-border bg-card p-16 text-center">
        <Construction className="h-10 w-10 text-muted-foreground/40" />
        <p className="font-medium text-foreground">Módulo em desenvolvimento</p>
        <p className="max-w-sm text-sm text-muted-foreground">
          {"A seção \""}
          {titles[view]}
          {"\" ainda não está disponível. Use \"Almoxarifado\" e \"Minha Frota\" que já estão funcionando."}
        </p>
      </div>
    </div>
  )
}

export function AppShell() {
  const [view, setView] = useState<ViewKey>("inventory")

  return (
    <main className="flex min-h-dvh bg-background">
      <Sidebar active={view} onSelect={setView} />
      <div className="flex-1 overflow-y-auto p-6 lg:p-8">
        {view === "inventory" ? (
          <InventoryView />
        ) : view === "fleet" ? (
          <FleetView />
        ) : (
          <ComingSoon view={view} />
        )}
      </div>
    </main>
  )
}
