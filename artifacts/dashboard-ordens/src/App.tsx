import { useState } from "react"
import { Factory, BarChart2, ClipboardList, Menu, X } from "lucide-react"
import { Dashboard } from "@/components/dashboard"
import { cn } from "@/lib/utils"

export type View = "visao-geral" | "ordens"

const navItems: { id: View; label: string; icon: typeof BarChart2; desc: string }[] = [
  { id: "visao-geral", label: "Visão Geral", icon: BarChart2, desc: "KPIs e gráficos" },
  { id: "ordens",      label: "Detalhes das Ordens", icon: ClipboardList, desc: "Filtros e tabela" },
]

export default function App() {
  const [view, setView] = useState<View>("visao-geral")
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <div className="flex min-h-screen bg-background">

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-20 bg-black/60 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-30 flex w-56 flex-col border-r border-border bg-background transition-transform duration-200 lg:translate-x-0 lg:static lg:z-auto",
          mobileOpen ? "translate-x-0" : "-translate-x-full",
        )}
      >
        {/* Sidebar header */}
        <div className="flex h-14 items-center gap-2.5 border-b border-border px-4">
          <span className="flex size-8 shrink-0 items-center justify-center rounded-md bg-primary/15 text-primary">
            <Factory className="size-4" />
          </span>
          <div className="min-w-0">
            <p className="truncate text-xs font-semibold leading-tight text-foreground">Monitor de Ordens</p>
            <p className="text-[10px] text-muted-foreground">PCP · Centro 8001</p>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex flex-col gap-1 p-2 pt-3">
          {navItems.map(({ id, label, icon: Icon, desc }) => (
            <button
              key={id}
              onClick={() => { setView(id); setMobileOpen(false) }}
              className={cn(
                "group flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-left transition-colors",
                view === id
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground",
              )}
            >
              <Icon className="size-4 shrink-0" />
              <div className="min-w-0">
                <p className="text-sm font-medium leading-tight">{label}</p>
                <p className={cn("text-[10px] leading-tight", view === id ? "text-primary/70" : "text-muted-foreground/60")}>{desc}</p>
              </div>
            </button>
          ))}
        </nav>

        {/* Bottom badge */}
        <div className="mt-auto p-4">
          <div className="flex items-center gap-2 rounded-md border border-border bg-muted/40 px-3 py-2">
            <span className="size-1.5 rounded-full bg-chart-3 shrink-0" />
            <span className="text-[10px] text-muted-foreground">SAP PP · MD11</span>
          </div>
        </div>
      </aside>

      {/* Main */}
      <div className="flex min-w-0 flex-1 flex-col">
        {/* Top bar */}
        <header className="sticky top-0 z-10 flex h-14 items-center gap-3 border-b border-border bg-background/80 px-4 backdrop-blur sm:px-6">
          <button
            className="flex size-8 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground lg:hidden"
            onClick={() => setMobileOpen((v) => !v)}
          >
            {mobileOpen ? <X className="size-4" /> : <Menu className="size-4" />}
          </button>
          <div>
            <h1 className="text-sm font-semibold leading-tight text-foreground">
              {navItems.find((n) => n.id === view)?.label}
            </h1>
            <p className="text-xs text-muted-foreground">
              {navItems.find((n) => n.id === view)?.desc}
            </p>
          </div>
        </header>

        <main className="flex-1 px-4 py-6 sm:px-6">
          <Dashboard view={view} />
        </main>
      </div>
    </div>
  )
}
