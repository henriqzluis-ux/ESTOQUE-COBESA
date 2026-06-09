import { Sidebar } from "@/components/sidebar"
import { InventoryView } from "@/components/inventory-view"

export default function Page() {
  return (
    <main className="flex min-h-dvh bg-background">
      <Sidebar />
      <div className="flex-1 overflow-y-auto p-6 lg:p-8">
        <InventoryView />
      </div>
    </main>
  )
}
