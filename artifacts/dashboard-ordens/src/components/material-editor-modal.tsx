
import { useState, useEffect } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Trash2, Download, Upload } from "lucide-react"
import {
  updateMaterialCustom,
  removeMaterialCustom,
  loadMaterialsCustom,
  exportMaterialsCustom,
  importMaterialsCustom,
} from "@/lib/materiais-storage"

interface MaterialEditorModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  codigo?: string
  descricaoInicial?: string
  categoriaInicial?: string
  onSave?: () => void
}

export function MaterialEditorModal({
  open,
  onOpenChange,
  codigo = "",
  descricaoInicial = "",
  categoriaInicial = "Outros",
  onSave,
}: MaterialEditorModalProps) {
  const [descricao, setDescricao] = useState(descricaoInicial)
  const [categoria, setCategoria] = useState(categoriaInicial)
  const [materiais, setMateriais] = useState<Record<string, any>>({})

  useEffect(() => {
    setMateriais(loadMaterialsCustom())
  }, [open])

  useEffect(() => {
    setDescricao(descricaoInicial)
    setCategoria(categoriaInicial)
  }, [descricaoInicial, categoriaInicial])

  const handleSave = () => {
    if (!codigo || !descricao.trim()) {
      alert("Preencha todos os campos")
      return
    }
    updateMaterialCustom(codigo, descricao.trim(), categoria.trim())
    setMateriais(loadMaterialsCustom())
    onSave?.()
    onOpenChange(false)
  }

  const handleRemove = () => {
    if (!codigo) return
    if (confirm(`Tem certeza que deseja remover a customização de ${codigo}?`)) {
      removeMaterialCustom(codigo)
      setMateriais(loadMaterialsCustom())
      onSave?.()
      onOpenChange(false)
    }
  }

  const handleExport = () => {
    const json = exportMaterialsCustom()
    const blob = new Blob([json], { type: "application/json" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = "materiais-customizados.json"
    a.click()
    URL.revokeObjectURL(url)
  }

  const handleImport = () => {
    const input = document.createElement("input")
    input.type = "file"
    input.accept = ".json"
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0]
      if (!file) return
      const reader = new FileReader()
      reader.onload = (event) => {
        try {
          const json = event.target?.result as string
          importMaterialsCustom(json)
          setMateriais(loadMaterialsCustom())
          alert("Materiais importados com sucesso!")
        } catch (err) {
          alert("Erro ao importar: JSON inválido")
        }
      }
      reader.readAsText(file)
    }
    input.click()
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[80vh] max-w-2xl overflow-y-auto">
        <Tabs defaultValue="editar" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="editar">Editar</TabsTrigger>
            <TabsTrigger value="lista">Lista de Customizações</TabsTrigger>
            <TabsTrigger value="importar">Importar/Exportar</TabsTrigger>
          </TabsList>

          {/* Aba de Edição */}
          <TabsContent value="editar" className="space-y-4">
            <DialogHeader>
              <DialogTitle>Editar Descrição do Material</DialogTitle>
              <DialogDescription>
                Customize a descrição e categoria do material {codigo}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div>
                <Label htmlFor="codigo">Código do Material</Label>
                <Input id="codigo" value={codigo} disabled className="bg-muted" />
              </div>

              <div>
                <Label htmlFor="descricao">Descrição</Label>
                <Input
                  id="descricao"
                  placeholder="Ex: Pão Francês Especial"
                  value={descricao}
                  onChange={(e) => setDescricao(e.target.value)}
                />
              </div>

              <div>
                <Label htmlFor="categoria">Categoria</Label>
                <Input
                  id="categoria"
                  placeholder="Ex: Pães, Doces, Matéria-prima..."
                  value={categoria}
                  onChange={(e) => setCategoria(e.target.value)}
                />
              </div>
            </div>

            <DialogFooter className="flex gap-2">
              {codigo && materiais[codigo] && (
                <Button variant="destructive" onClick={handleRemove}>
                  <Trash2 className="mr-2 size-4" />
                  Remover
                </Button>
              )}
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Cancelar
              </Button>
              <Button onClick={handleSave}>Salvar</Button>
            </DialogFooter>
          </TabsContent>

          {/* Aba de Lista */}
          <TabsContent value="lista" className="space-y-4">
            <DialogHeader>
              <DialogTitle>Materiais Customizados</DialogTitle>
              <DialogDescription>
                {Object.keys(materiais).length === 0
                  ? "Nenhum material customizado ainda"
                  : `${Object.keys(materiais).length} material(is) customizado(s)`}
              </DialogDescription>
            </DialogHeader>

            <div className="max-h-[400px] space-y-2 overflow-y-auto">
              {Object.entries(materiais).map(([cod, info]) => (
                <div
                  key={cod}
                  className="space-y-1 rounded border border-border bg-muted/50 p-3"
                >
                  <p className="font-mono text-sm text-muted-foreground">{cod}</p>
                  <p className="font-medium">{info.descricao}</p>
                  <p className="text-sm text-muted-foreground">{info.categoria}</p>
                </div>
              ))}
            </div>
          </TabsContent>

          {/* Aba de Importar/Exportar */}
          <TabsContent value="importar" className="space-y-4">
            <DialogHeader>
              <DialogTitle>Importar/Exportar</DialogTitle>
              <DialogDescription>
                Faça backup ou compartilhe suas customizações
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">
                Exporte suas customizações como arquivo JSON para fazer backup ou
                compartilhar com outros usuários.
              </p>
              <Button onClick={handleExport} className="w-full">
                <Download className="mr-2 size-4" />
                Exportar como JSON
              </Button>
            </div>

            <div className="space-y-2 border-t border-border pt-4">
              <p className="text-sm text-muted-foreground">
                Importe um arquivo JSON com customizações anteriormente salvas.
              </p>
              <Button onClick={handleImport} variant="outline" className="w-full">
                <Upload className="mr-2 size-4" />
                Importar de JSON
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}
