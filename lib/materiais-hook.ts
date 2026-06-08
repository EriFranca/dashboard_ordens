import { useEffect, useState } from 'react'
import { loadMaterialsCustom, type MaterialCustom } from '@/lib/materiais-storage'
import { materiaisInfo, type MaterialInfo } from '@/lib/materiais'

/**
 * Hook que combina materiais cadastrados com customizações do usuário
 */
export function useMaterialInfo() {
  const [custom, setCustom] = useState<Record<string, MaterialCustom>>({})
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    setCustom(loadMaterialsCustom())
    setLoaded(true)
  }, [])

  const getMaterialInfo = (codigo: string): MaterialInfo => {
    // Prioriza customizações do usuário
    if (custom[codigo]) {
      return custom[codigo]
    }
    // Depois busca no cadastro padrão
    if (materiaisInfo[codigo]) {
      return materiaisInfo[codigo]
    }
    // Fallback
    return { descricao: 'Material não cadastrado', categoria: 'Outros' }
  }

  const getMaterialDescricao = (codigo: string): string => {
    return getMaterialInfo(codigo).descricao
  }

  const getMaterialCategoria = (codigo: string): string => {
    return getMaterialInfo(codigo).categoria
  }

  return { getMaterialInfo, getMaterialDescricao, getMaterialCategoria, loaded }
}
