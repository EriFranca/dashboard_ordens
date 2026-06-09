import { Factory } from "lucide-react"
import { Dashboard } from "@/components/dashboard"

export default function Page() {
  return (
    <main className="min-h-screen bg-background">
      <header className="sticky top-0 z-10 border-b border-border bg-background/80 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
          <div className="flex items-center gap-3">
            <span className="flex size-9 items-center justify-center rounded-md bg-primary/15 text-primary">
              <Factory className="size-5" />
            </span>
            <div>
              <h1 className="text-sm font-semibold leading-tight text-foreground">
                Monitor de Ordens Planejadas
              </h1>
              <p className="text-xs text-muted-foreground">PCP · Produção · Centro 8001</p>
            </div>
          </div>
          <div className="hidden items-center gap-2 sm:flex">
            <span className="size-2 rounded-full bg-chart-3" />
            <span className="text-xs text-muted-foreground">Dados SAP PP · MD11</span>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
        <Dashboard />
      </div>
    </main>
  )
}
