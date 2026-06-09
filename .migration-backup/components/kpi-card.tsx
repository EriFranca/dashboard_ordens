import { Card } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import type { LucideIcon } from "lucide-react"

interface KpiCardProps {
  titulo: string
  valor: string
  sub?: string
  icon: LucideIcon
  acento?: "primary" | "verde" | "ambar" | "vermelho"
}

const acentos = {
  primary: "text-primary bg-primary/10",
  verde: "text-chart-3 bg-chart-3/10",
  ambar: "text-chart-2 bg-chart-2/10",
  vermelho: "text-destructive bg-destructive/10",
}

export function KpiCard({ titulo, valor, sub, icon: Icon, acento = "primary" }: KpiCardProps) {
  return (
    <Card className="p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{titulo}</p>
          <p className="mt-2 text-2xl font-semibold tabular-nums tracking-tight text-foreground">{valor}</p>
          {sub && <p className="mt-1 text-xs text-muted-foreground">{sub}</p>}
        </div>
        <span className={cn("flex size-9 shrink-0 items-center justify-center rounded-md", acentos[acento])}>
          <Icon className="size-5" />
        </span>
      </div>
    </Card>
  )
}
