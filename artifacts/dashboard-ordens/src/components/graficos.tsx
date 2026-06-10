
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  Cell,
  CartesianGrid,
  Pie,
  PieChart,
  XAxis,
  YAxis,
} from "recharts"
import { formatNumber, formatMoeda } from "@/lib/metrics"

const fmtCompact = (n: number) =>
  Intl.NumberFormat("pt-BR", { notation: "compact", maximumFractionDigits: 1 }).format(n)

export function GraficoFluxo({ data }: { data: { dia: string; planejado: number; recebido: number }[] }) {
  return (
    <Card className="lg:col-span-2">
      <CardHeader>
        <CardTitle className="text-base">Planejado x Recebido</CardTitle>
        <CardDescription>Quantidades por data de abertura da ordem</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer
          config={{
            planejado: { label: "Planejado", color: "var(--chart-1)" },
            recebido: { label: "Recebido", color: "var(--chart-3)" },
          }}
          className="h-[280px] w-full"
        >
          <AreaChart data={data} margin={{ left: 4, right: 8, top: 8 }}>
            <defs>
              <linearGradient id="fillPlan" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="var(--color-planejado)" stopOpacity={0.5} />
                <stop offset="95%" stopColor="var(--color-planejado)" stopOpacity={0.05} />
              </linearGradient>
              <linearGradient id="fillReceb" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="var(--color-recebido)" stopOpacity={0.5} />
                <stop offset="95%" stopColor="var(--color-recebido)" stopOpacity={0.05} />
              </linearGradient>
            </defs>
            <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="var(--border)" />
            <XAxis dataKey="dia" tickLine={false} axisLine={false} tickMargin={8} fontSize={11} />
            <YAxis tickLine={false} axisLine={false} width={40} fontSize={11} tickFormatter={fmtCompact} />
            <ChartTooltip content={<ChartTooltipContent />} />
            <Area
              dataKey="planejado"
              type="monotone"
              fill="url(#fillPlan)"
              stroke="var(--color-planejado)"
              strokeWidth={2}
            />
            <Area
              dataKey="recebido"
              type="monotone"
              fill="url(#fillReceb)"
              stroke="var(--color-recebido)"
              strokeWidth={2}
            />
          </AreaChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}

const CORES_STATUS: Record<string, string> = {
  Concluído: "var(--chart-3)",
  Parcial: "var(--chart-2)",
  Pendente: "var(--chart-4)",
}

export function GraficoStatus({ data }: { data: { status: string; qtd: number }[] }) {
  const total = data.reduce((a, d) => a + d.qtd, 0)
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Status de recebimento</CardTitle>
        <CardDescription>{total} ordens</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer
          config={{ qtd: { label: "Ordens" } }}
          className="mx-auto aspect-square h-[220px]"
        >
          <PieChart>
            <ChartTooltip content={<ChartTooltipContent nameKey="status" />} />
            <Pie data={data} dataKey="qtd" nameKey="status" innerRadius={56} outerRadius={88} strokeWidth={2}>
              {data.map((d) => (
                <Cell key={d.status} fill={CORES_STATUS[d.status]} stroke="var(--card)" />
              ))}
            </Pie>
          </PieChart>
        </ChartContainer>
        <div className="mt-2 flex flex-col gap-2">
          {data.map((d) => (
            <div key={d.status} className="flex items-center justify-between text-sm">
              <span className="flex items-center gap-2 text-muted-foreground">
                <span className="size-2.5 rounded-full" style={{ background: CORES_STATUS[d.status] }} />
                {d.status}
              </span>
              <span className="font-medium tabular-nums">{d.qtd}</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

export function GraficoMateriais({
  data,
}: {
  data: { material: string; descricao: string; qtdKg: number; ordens: number }[]
}) {
  const dados = data.map((d) => ({
    ...d,
    rotulo: d.descricao.length > 26 ? d.descricao.slice(0, 25) + "…" : d.descricao,
  }))
  return (
    <Card className="lg:col-span-2">
      <CardHeader>
        <CardTitle className="text-base">Top materiais por quantidade confirmada</CardTitle>
        <CardDescription>Quantidade confirmada em KG por material</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer
          config={{ qtdKg: { label: "KG", color: "var(--chart-1)" } }}
          className="h-[300px] w-full"
        >
          <BarChart data={dados} layout="vertical" margin={{ left: 8, right: 16 }}>
            <CartesianGrid horizontal={false} strokeDasharray="3 3" stroke="var(--border)" />
            <XAxis type="number" tickLine={false} axisLine={false} fontSize={11} tickFormatter={fmtCompact} />
            <YAxis
              type="category"
              dataKey="rotulo"
              tickLine={false}
              axisLine={false}
              width={170}
              fontSize={10}
              interval={0}
            />
            <ChartTooltip
              content={
                <ChartTooltipContent
                  formatter={(v) =>
                    Intl.NumberFormat("pt-BR", { maximumFractionDigits: 1 }).format(Number(v)) + " kg"
                  }
                  labelKey="descricao"
                />
              }
            />
            <Bar dataKey="qtdKg" fill="var(--color-qtdKg)" radius={[0, 4, 4, 0]} />
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}

export function GraficoUnidade({ data }: { data: { unidade: string; qtd: number }[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Ordens por unidade</CardTitle>
        <CardDescription>Distribuição por unidade de medida</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer
          config={{ qtd: { label: "Ordens", color: "var(--chart-2)" } }}
          className="h-[220px] w-full"
        >
          <BarChart data={data} margin={{ left: 4, right: 8 }}>
            <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="var(--border)" />
            <XAxis dataKey="unidade" tickLine={false} axisLine={false} tickMargin={8} fontSize={11} />
            <YAxis tickLine={false} axisLine={false} width={36} fontSize={11} tickFormatter={(v) => formatNumber(v)} />
            <ChartTooltip content={<ChartTooltipContent />} />
            <Bar dataKey="qtd" fill="var(--color-qtd)" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}

const CORES_CAT = [
  "var(--chart-1)",
  "var(--chart-3)",
  "var(--chart-2)",
  "var(--chart-4)",
  "var(--chart-5)",
  "var(--primary)",
]

export function GraficoCategoria({
  data,
}: {
  data: { categoria: string; valor: number; ordens: number; qtd: number }[]
}) {
  const totalValor = data.reduce((a, d) => a + d.valor, 0)
  const totalOrdens = data.reduce((a, d) => a + d.ordens, 0)
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Valor por categoria de produto</CardTitle>
        <CardDescription>
          Categorização derivada da descrição do material · {totalOrdens} ordens
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer
          config={{ valor: { label: "Valor EM", color: "var(--chart-1)" } }}
          className="h-[260px] w-full"
        >
          <BarChart data={data} margin={{ left: 4, right: 8, top: 8 }}>
            <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="var(--border)" />
            <XAxis
              dataKey="categoria"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              fontSize={10}
              interval={0}
            />
            <YAxis tickLine={false} axisLine={false} width={44} fontSize={11} tickFormatter={fmtCompact} />
            <ChartTooltip
              content={<ChartTooltipContent formatter={(v) => formatMoeda(Number(v))} labelKey="categoria" />}
            />
            <Bar dataKey="valor" radius={[4, 4, 0, 0]}>
              {data.map((d, i) => (
                <Cell key={d.categoria} fill={CORES_CAT[i % CORES_CAT.length]} />
              ))}
            </Bar>
          </BarChart>
        </ChartContainer>
        <div className="mt-3 grid grid-cols-2 gap-x-6 gap-y-1.5 sm:grid-cols-3">
          {data.map((d, i) => (
            <div key={d.categoria} className="flex items-center justify-between gap-2 text-sm">
              <span className="flex items-center gap-2 truncate text-muted-foreground">
                <span
                  className="size-2.5 shrink-0 rounded-full"
                  style={{ background: CORES_CAT[i % CORES_CAT.length] }}
                />
                <span className="truncate">{d.categoria}</span>
              </span>
              <span className="shrink-0 font-medium tabular-nums">
                {totalValor > 0 ? formatNumber((d.valor / totalValor) * 100) : 0}%
              </span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
