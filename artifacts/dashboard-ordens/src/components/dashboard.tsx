
import { useMemo, useState } from "react"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Search, Package, CheckCircle2, Clock, CircleDollarSign, Boxes } from "lucide-react"
import { ordens as todasOrdens } from "@/lib/data"
import {
  filtrar,
  resumo,
  porDia,
  statusDistribuicao,
  topMateriais,
  porUnidade,
  porCategoria,
  formatNumber,
  formatMoeda,
  unidadesDisponiveis,
  categoriasDisponiveis,
  type Filtros,
} from "@/lib/metrics"
import { KpiCard } from "@/components/kpi-card"
import { GraficoFluxo, GraficoStatus, GraficoMateriais, GraficoUnidade, GraficoCategoria } from "@/components/graficos"
import { TabelaOrdens } from "@/components/tabela-ordens"
import { DateRangePicker } from "@/components/date-range-picker"
import { SyncStatus } from "@/components/sync-status"
import type { View } from "@/App"

interface DateRange {
  start: Date | null
  end: Date | null
}

export function Dashboard({ view }: { view: View }) {
  const [filtros, setFiltros] = useState<Filtros>({ busca: "", status: "todos", unidade: "todas", categoria: "todas" })
  const [dateRange, setDateRange] = useState<DateRange>({ start: null, end: null })

  const ordensFiltradasPorData = useMemo(() => {
    if (!dateRange.start || !dateRange.end) return todasOrdens
    return todasOrdens.filter((ordem) => {
      const dataAbertura = new Date(ordem.dtAbertura ?? '')
      return dataAbertura >= dateRange.start! && dataAbertura <= dateRange.end!
    })
  }, [dateRange])

  const lista = useMemo(() => filtrar(ordensFiltradasPorData, filtros), [ordensFiltradasPorData, filtros])
  const r = useMemo(() => resumo(lista), [lista])
  const fluxo = useMemo(() => porDia(lista), [lista])
  const dist = useMemo(() => statusDistribuicao(lista), [lista])
  const mats = useMemo(() => topMateriais(lista), [lista])
  const unidades = useMemo(() => porUnidade(lista), [lista])
  const categorias = useMemo(() => porCategoria(lista), [lista])

  const kpis = (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
      <KpiCard titulo="Ordens planejadas" valor={formatNumber(r.total)} sub="Centro 8001 · PP01" icon={Package} />
      <KpiCard
        titulo="Qtd. planejada"
        valor={formatNumber(r.totalQtd)}
        sub={`${formatNumber(r.totalEntrada)} confirmado`}
        icon={Boxes}
        acento="primary"
      />
      <KpiCard
        titulo="Taxa de atendimento"
        valor={`${formatNumber(r.taxaAtend)}%`}
        sub="Confirmado / planejado"
        icon={CheckCircle2}
        acento="verde"
      />
      <KpiCard
        titulo="Pendentes"
        valor={formatNumber(r.pendentes)}
        sub={`${formatNumber(r.parciais)} parciais`}
        icon={Clock}
        acento="ambar"
      />
      <KpiCard
        titulo="Valor entrada (EM)"
        valor={formatMoeda(r.totalValor)}
        sub="Mercadoria recebida"
        icon={CircleDollarSign}
        acento="primary"
      />
    </div>
  )

  if (view === "visao-geral") {
    return (
      <div className="flex flex-col gap-6">
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-4">
          <div className="lg:col-span-3" />
          <SyncStatus />
        </div>

        {kpis}

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <GraficoFluxo data={fluxo} />
          <GraficoStatus data={dist} />
        </div>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <GraficoMateriais data={mats} />
          <GraficoUnidade data={unidades} />
        </div>

        <GraficoCategoria data={categorias} />
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      {kpis}

      {/* Filtros */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar por ordem, material ou ordem planejada..."
            value={filtros.busca}
            onChange={(e) => setFiltros((f) => ({ ...f, busca: e.target.value }))}
            className="pl-9"
          />
        </div>
        <div className="sm:max-w-xs">
          <DateRangePicker value={dateRange} onChange={setDateRange} label="Período" />
        </div>
        <Select
          value={filtros.status}
          onValueChange={(v) => setFiltros((f) => ({ ...f, status: v as Filtros["status"] }))}
        >
          <SelectTrigger className="sm:w-44">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos os status</SelectItem>
            <SelectItem value="concluido">Concluído</SelectItem>
            <SelectItem value="parcial">Parcial</SelectItem>
            <SelectItem value="pendente">Pendente</SelectItem>
            <SelectItem value="extra">Extra</SelectItem>
          </SelectContent>
        </Select>
        <Select
          value={filtros.unidade}
          onValueChange={(v) => setFiltros((f) => ({ ...f, unidade: v }))}
        >
          <SelectTrigger className="sm:w-36">
            <SelectValue placeholder="Unidade" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todas">Todas as unid.</SelectItem>
            {unidadesDisponiveis.map((u) => (
              <SelectItem key={u} value={u}>{u}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select
          value={filtros.categoria}
          onValueChange={(v) => setFiltros((f) => ({ ...f, categoria: v }))}
        >
          <SelectTrigger className="sm:w-48">
            <SelectValue placeholder="Categoria" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todas">Todas as categorias</SelectItem>
            {categoriasDisponiveis.map((c) => (
              <SelectItem key={c} value={c}>{c}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <TabelaOrdens ordens={lista} />
    </div>
  )
}
