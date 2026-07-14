import { Sidebar } from "@/components/sidebar"
import { FleetView } from "@/components/fleet-view"

export default function FrotaPage() {
  return (
    <main className="flex min-h-dvh bg-background">
      <Sidebar />
      <div className="flex-1 overflow-y-auto p-6 lg:p-8">
        <FleetView />
      </div>
    </main>
  )
}
