import { useState } from "react"
import { Trash2, Plus, Scale } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useConversoesKg } from "@/lib/conversoes-context"
import { getMaterialDescricao } from "@/lib/materiais"
import { ordens } from "@/lib/data"

const materiaisUN = [...new Set(ordens.filter((o) => o.unid === "UN").map((o) => o.material))].sort()

export function PainelConversoes() {
  const { conversoesUN, addConversao, removeConversao } = useConversoesKg()
  const [novoCodigo, setNovoCodigo] = useState("")
  const [novoGramas, setNovoGramas] = useState("")
  const [erro, setErro] = useState("")
  const [sugestoes, setSugestoes] = useState<string[]>([])

  function handleCodigoChange(val: string) {
    setNovoCodigo(val)
    setErro("")
    if (val.trim().length >= 2) {
      setSugestoes(materiaisUN.filter((m) => m.startsWith(val.trim())).slice(0, 6))
    } else {
      setSugestoes([])
    }
  }

  function handleAdd() {
    const codigo = novoCodigo.trim()
    const gramas = parseFloat(novoGramas)

    if (!codigo) { setErro("Informe o código do material."); return }
    if (isNaN(gramas) || gramas <= 0) { setErro("Informe o peso em gramas (ex: 150)."); return }
    if (!materiaisUN.includes(codigo)) { setErro("Material não encontrado ou não é unidade UN."); return }

    addConversao(codigo, gramas)
    setNovoCodigo("")
    setNovoGramas("")
    setSugestoes([])
    setErro("")
  }

  const itens = Object.entries(conversoesUN).sort(([a], [b]) => a.localeCompare(b))

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Scale className="size-4 text-primary" />
            <CardTitle className="text-base">Conversão UN → KG</CardTitle>
          </div>
          <CardDescription>
            Materiais em UN que devem ser somados em KG no gráfico "Top materiais por quantidade confirmada".
            As alterações são salvas automaticamente.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">

          {/* Lista de conversões ativas */}
          {itens.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhuma conversão configurada.</p>
          ) : (
            <div className="flex flex-col gap-1">
              <div className="grid grid-cols-[1fr_auto_auto_auto] gap-2 px-2 pb-1 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                <span>Material</span>
                <span className="text-right">Peso</span>
                <span className="text-right">Kg/un</span>
                <span />
              </div>
              {itens.map(([codigo, { gramas }]) => (
                <div
                  key={codigo}
                  className="grid grid-cols-[1fr_auto_auto_auto] items-center gap-2 rounded-md border border-border bg-muted/30 px-3 py-2"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-foreground">{codigo}</p>
                    <p className="truncate text-[11px] text-muted-foreground">
                      {getMaterialDescricao(codigo)}
                    </p>
                  </div>
                  <Badge variant="outline" className="justify-end text-xs tabular-nums">
                    {gramas} g
                  </Badge>
                  <Badge variant="outline" className="justify-end text-xs tabular-nums text-chart-1">
                    {(gramas / 1000).toFixed(3)} kg
                  </Badge>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="size-7 text-muted-foreground hover:text-destructive"
                    onClick={() => removeConversao(codigo)}
                    title="Remover"
                  >
                    <Trash2 className="size-3.5" />
                  </Button>
                </div>
              ))}
            </div>
          )}

          {/* Formulário de adição */}
          <div className="flex flex-col gap-2 rounded-md border border-dashed border-border p-3">
            <p className="text-xs font-medium text-muted-foreground">Adicionar material</p>
            <div className="flex flex-col gap-2 sm:flex-row">
              <div className="relative flex-1">
                <Input
                  placeholder="Código (ex: 251066)"
                  value={novoCodigo}
                  onChange={(e) => handleCodigoChange(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleAdd()}
                  className="text-sm"
                />
                {sugestoes.length > 0 && (
                  <div className="absolute left-0 top-full z-50 mt-1 w-full rounded-md border border-border bg-background shadow-md">
                    {sugestoes.map((m) => (
                      <button
                        key={m}
                        className="flex w-full flex-col px-3 py-1.5 text-left text-sm hover:bg-muted"
                        onClick={() => { setNovoCodigo(m); setSugestoes([]) }}
                      >
                        <span className="font-medium">{m}</span>
                        <span className="text-[11px] text-muted-foreground">{getMaterialDescricao(m)}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <Input
                placeholder="Peso (g) ex: 150"
                value={novoGramas}
                onChange={(e) => { setNovoGramas(e.target.value); setErro("") }}
                onKeyDown={(e) => e.key === "Enter" && handleAdd()}
                className="text-sm sm:w-36"
                type="number"
                min="1"
              />
              <Button onClick={handleAdd} className="gap-1.5 sm:w-auto">
                <Plus className="size-4" />
                Adicionar
              </Button>
            </div>
            {erro && <p className="text-xs text-destructive">{erro}</p>}
          </div>

        </CardContent>
      </Card>
    </div>
  )
}
