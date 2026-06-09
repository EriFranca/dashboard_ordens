
import { useMemo, useState } from "react"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { type Ordem } from "@/lib/data"
import { statusDe, statusLabel, formatNumber, formatMoeda, type StatusRecebimento } from "@/lib/metrics"
import { getMaterialInfo } from "@/lib/materiais"
import { cn } from "@/lib/utils"

const POR_PAGINA = 12

const badgeStatus: Record<StatusRecebimento, string> = {
  concluido: "border-chart-3/30 bg-chart-3/10 text-chart-3",
  parcial: "border-chart-2/30 bg-chart-2/10 text-chart-2",
  pendente: "border-chart-4/30 bg-chart-4/10 text-chart-4",
}

export function TabelaOrdens({ ordens }: { ordens: Ordem[] }) {
  const [pagina, setPagina] = useState(0)
  const totalPaginas = Math.max(1, Math.ceil(ordens.length / POR_PAGINA))
  const paginaAtual = Math.min(pagina, totalPaginas - 1)

  const visiveis = useMemo(
    () => ordens.slice(paginaAtual * POR_PAGINA, paginaAtual * POR_PAGINA + POR_PAGINA),
    [ordens, paginaAtual],
  )

  return (
    <Card className="overflow-hidden py-0">
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead>Ordem</TableHead>
              <TableHead className="min-w-[220px]">Material</TableHead>
              <TableHead className="text-right">Planejado</TableHead>
              <TableHead className="text-right">Confirmado</TableHead>
              <TableHead className="text-right">Atend.</TableHead>
              <TableHead className="text-right">Valor EM</TableHead>
              <TableHead>Abertura</TableHead>
              <TableHead>Remessa</TableHead>
              <TableHead className="text-right">Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {visiveis.map((o) => {
              const st = statusDe(o)
              const atend = o.qtdPlan > 0 ? (o.qtdEntrada / o.qtdPlan) * 100 : 0
              const info = getMaterialInfo(o.material)
              return (
                <TableRow key={o.ordem}>
                  <TableCell className="font-mono text-xs text-muted-foreground">{o.ordem}</TableCell>
                  <TableCell>
                    <span className="block font-medium leading-tight text-pretty">{info.descricao}</span>
                    <span className="font-mono text-xs text-muted-foreground">
                      {o.material} · {info.categoria}
                    </span>
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {formatNumber(o.qtdPlan, o.unid === "KG" ? 2 : 0)} <span className="text-muted-foreground">{o.unid}</span>
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {formatNumber(o.qtdEntrada, o.unid === "KG" ? 2 : 0)}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    <span
                      className={cn(
                        atend >= 100 ? "text-chart-3" : atend > 0 ? "text-chart-2" : "text-muted-foreground",
                      )}
                    >
                      {formatNumber(atend)}%
                    </span>
                  </TableCell>
                  <TableCell className="text-right tabular-nums">{formatMoeda(o.valor)}</TableCell>
                  <TableCell className="text-muted-foreground">{o.dtAbertura ?? "—"}</TableCell>
                  <TableCell className="text-muted-foreground">{o.dtRemessaPlan ?? "—"}</TableCell>
                  <TableCell className="text-right">
                    <Badge variant="outline" className={cn("font-medium", badgeStatus[st])}>
                      {statusLabel[st]}
                    </Badge>
                  </TableCell>
                </TableRow>
              )
            })}
            {visiveis.length === 0 && (
              <TableRow>
                <TableCell colSpan={9} className="h-24 text-center text-muted-foreground">
                  Nenhuma ordem encontrada com os filtros atuais.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <div className="flex items-center justify-between border-t border-border px-4 py-3 text-sm">
        <p className="text-muted-foreground">
          {ordens.length} {ordens.length === 1 ? "ordem" : "ordens"}
        </p>
        <div className="flex items-center gap-3">
          <span className="text-muted-foreground tabular-nums">
            {paginaAtual + 1} de {totalPaginas}
          </span>
          <div className="flex gap-1">
            <Button
              variant="outline"
              size="icon"
              className="size-8 bg-transparent"
              onClick={() => setPagina((p) => Math.max(0, p - 1))}
              disabled={paginaAtual === 0}
            >
              <ChevronLeft className="size-4" />
              <span className="sr-only">Página anterior</span>
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="size-8 bg-transparent"
              onClick={() => setPagina((p) => Math.min(totalPaginas - 1, p + 1))}
              disabled={paginaAtual >= totalPaginas - 1}
            >
              <ChevronRight className="size-4" />
              <span className="sr-only">Próxima página</span>
            </Button>
          </div>
        </div>
      </div>
    </Card>
  )
}
