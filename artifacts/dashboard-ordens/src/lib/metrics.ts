import { ordens, type Ordem } from "./data"
import { getMaterialDescricao, getMaterialCategoria } from "./materiais"

export type StatusRecebimento = "concluido" | "parcial" | "pendente" | "extra"

export function statusDe(o: Ordem): StatusRecebimento {
  if (o.qtdPlan === 0 && o.qtdEntrada > 0) return "extra"
  if (o.recebConcluido && o.qtdEntrada >= o.qtdPlan && o.qtdPlan > 0) return "concluido"
  if (o.qtdEntrada > 0) return "parcial"
  return "pendente"
}

export const statusLabel: Record<StatusRecebimento, string> = {
  concluido: "Concluído",
  parcial: "Parcial",
  pendente: "Pendente",
  extra: "Extra",
}

export function parseData(d: string | null): Date | null {
  if (!d) return null
  const [dia, mes, ano] = d.split("/")
  if (!dia || !mes || !ano) return null
  return new Date(Number(ano), Number(mes) - 1, Number(dia))
}

export function formatNumber(n: number, frac = 0) {
  return n.toLocaleString("pt-BR", {
    minimumFractionDigits: frac,
    maximumFractionDigits: frac,
  })
}

export function formatMoeda(n: number) {
  return n.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  })
}

export interface Filtros {
  busca: string
  status: "todos" | StatusRecebimento
  unidade: "todas" | string
  categoria: "todas" | string
}

export function filtrar(lista: Ordem[], f: Filtros): Ordem[] {
  return lista.filter((o) => {
    if (f.status !== "todos" && statusDe(o) !== f.status) return false
    if (f.unidade !== "todas" && o.unid !== f.unidade) return false
    if (f.categoria !== "todas" && getMaterialCategoria(o.material) !== f.categoria) return false
    if (f.busca.trim()) {
      const q = f.busca.trim().toLowerCase()
      const alvo = `${o.ordem} ${o.op ?? ""} ${o.material} ${getMaterialDescricao(o.material)}`.toLowerCase()
      if (!alvo.includes(q)) return false
    }
    return true
  })
}

export function resumo(lista: Ordem[]) {
  const totalQtd = lista.reduce((a, o) => a + o.qtdPlan, 0)      // col V — planejado
  const totalEntrada = lista.reduce((a, o) => a + o.qtdEntrada, 0) // col P — confirmado
  const totalValor = lista.reduce((a, o) => a + o.valor, 0)
  const concluidas = lista.filter((o) => statusDe(o) === "concluido").length
  const parciais = lista.filter((o) => statusDe(o) === "parcial").length
  const pendentes = lista.filter((o) => statusDe(o) === "pendente").length
  const extras = lista.filter((o) => statusDe(o) === "extra").length
  const taxaAtend = totalQtd > 0 ? (totalEntrada / totalQtd) * 100 : 0
  return {
    total: lista.length,
    totalQtd,
    totalEntrada,
    totalValor,
    concluidas,
    parciais,
    pendentes,
    extras,
    taxaAtend,
  }
}

// Quantidade planejada x confirmada por dia (data de abertura)
export function porDia(lista: Ordem[]) {
  const map = new Map<string, { planejado: number; recebido: number; ordem: number }>()
  for (const o of lista) {
    const d = parseData(o.dtAbertura)
    if (!d) continue
    const key = `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}`
    const cur = map.get(key) ?? { planejado: 0, recebido: 0, ordem: d.getTime() }
    cur.planejado += o.qtdPlan      // col V
    cur.recebido += o.qtdEntrada    // col P
    map.set(key, cur)
  }
  return [...map.entries()]
    .map(([dia, v]) => ({ dia, ...v }))
    .sort((a, b) => a.ordem - b.ordem)
}

export function porUnidade(lista: Ordem[]) {
  const map = new Map<string, number>()
  for (const o of lista) map.set(o.unid, (map.get(o.unid) ?? 0) + 1)
  return [...map.entries()].map(([unidade, qtd]) => ({ unidade, qtd }))
}

export function topMateriais(lista: Ordem[], n = 8) {
  const map = new Map<string, { qtd: number; valor: number; ordens: number }>()
  for (const o of lista) {
    const cur = map.get(o.material) ?? { qtd: 0, valor: 0, ordens: 0 }
    cur.qtd += o.qtdPlan    // col V — planejado
    cur.valor += o.valor
    cur.ordens += 1
    map.set(o.material, cur)
  }
  return [...map.entries()]
    .map(([material, v]) => ({
      material,
      descricao: getMaterialDescricao(material),
      ...v,
    }))
    .sort((a, b) => b.valor - a.valor)
    .slice(0, n)
}

// Agregação por categoria de material (valor e ordens)
export function porCategoria(lista: Ordem[]) {
  const map = new Map<string, { valor: number; ordens: number; qtd: number }>()
  for (const o of lista) {
    const cat = getMaterialCategoria(o.material)
    const cur = map.get(cat) ?? { valor: 0, ordens: 0, qtd: 0 }
    cur.valor += o.valor
    cur.ordens += 1
    cur.qtd += o.qtdPlan    // col V — planejado
    map.set(cat, cur)
  }
  return [...map.entries()]
    .map(([categoria, v]) => ({ categoria, ...v }))
    .sort((a, b) => b.valor - a.valor)
}

export function statusDistribuicao(lista: Ordem[]) {
  const r = resumo(lista)
  return [
    { status: "Concluído", qtd: r.concluidas, key: "concluido" },
    { status: "Parcial", qtd: r.parciais, key: "parcial" },
    { status: "Pendente", qtd: r.pendentes, key: "pendente" },
    { status: "Extra", qtd: r.extras, key: "extra" },
  ]
}

export const unidadesDisponiveis = [...new Set(ordens.map((o) => o.unid))].sort()

export const categoriasDisponiveis = [...new Set(ordens.map((o) => getMaterialCategoria(o.material)))].sort()
