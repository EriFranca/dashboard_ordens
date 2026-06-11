import { useState } from "react"
import { Factory, BarChart2, ClipboardList, Settings, Menu, X } from "lucide-react"
import { Dashboard } from "@/components/dashboard"
import { PainelConversoes } from "@/components/painel-conversoes"
import { ConversoesProvider } from "@/lib/conversoes-context"
import { cn } from "@/lib/utils"

export type View = "visao-geral" | "ordens" | "configuracoes"

const navItems: { id: View; label: string; icon: typeof BarChart2; desc: string }[] = [
  { id: "visao-geral",    label: "Visão Geral",        icon: BarChart2,    desc: "KPIs e gráficos" },
  { id: "ordens",         label: "Detalhes das Ordens", icon: ClipboardList, desc: "Filtros e tabela" },
]

const navBottom: { id: View; label: string; icon: typeof BarChart2; desc: string }[] = [
  { id: "configuracoes",  label: "Configurações",       icon: Settings,     desc: "Conversões UN → KG" },
]

export default function App() {
  const [view, setView] = useState<View>("visao-geral")
  const [mobileOpen, setMobileOpen] = useState(false)

  const allNavItems = [...navItems, ...navBottom]
  const activeItem = allNavItems.find((n) => n.id === view)

  function NavButton({ id, label, icon: Icon, desc }: typeof navItems[number]) {
    return (
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
    )
  }

  return (
    <ConversoesProvider>
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
            "fixed inset-y-0 left-0 z-30 flex w-56 flex-col border-r border-border bg-background transition-transform duration-200 lg:sticky lg:top-0 lg:h-screen lg:translate-x-0 lg:z-auto",
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

          {/* Nav principal */}
          <nav className="flex flex-col gap-1 p-2 pt-3">
            {navItems.map((item) => <NavButton key={item.id} {...item} />)}
          </nav>

          {/* Nav inferior — configurações */}
          <nav className="mt-auto flex flex-col gap-1 border-t border-border p-2">
            {navBottom.map((item) => <NavButton key={item.id} {...item} />)}
          </nav>
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
                {activeItem?.label}
              </h1>
              <p className="text-xs text-muted-foreground">
                {activeItem?.desc}
              </p>
            </div>
          </header>

          <main className="flex-1 px-4 py-6 sm:px-6">
            {view === "configuracoes" ? <PainelConversoes /> : <Dashboard view={view} />}
          </main>
        </div>
      </div>
    </ConversoesProvider>
  )
}
