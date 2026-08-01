"use client"

import { useState } from "react"
import { Sidebar, type ViewKey } from "@/components/sidebar"
import { InventoryView } from "@/components/inventory-view"
import { FleetView } from "@/components/fleet-view"
import { ServicesView } from "@/components/services-view"
import { PreventivesView } from "@/components/preventives-view"
import { ConferenceView } from "@/components/conference-view"
import { OverviewView } from "@/components/overview-view"
import { ReportsView } from "@/components/reports-view"
import { AiAnalysisView } from "@/components/ai-analysis-view"

export function AppShell() {
  const [view, setView] = useState<ViewKey>("visao-geral")

  return (
    <main className="flex min-h-dvh bg-background">
      <Sidebar active={view} onNavigate={setView} />
      <div className="flex-1 overflow-y-auto p-6 lg:p-8">
        {view === "visao-geral" && <OverviewView onNavigate={setView} />}
        {view === "frota" && <FleetView />}
        {view === "almoxarifado" && <InventoryView />}
        {view === "relatorios" && <ReportsView />}
        {view === "servicos" && <ServicesView />}
        {view === "preventivas" && <PreventivesView onNavigate={setView} />}
        {view === "conferencia" && <ConferenceView />}
        {view === "analise-ia" && <AiAnalysisView />}
      </div>
    </main>
  )
}
