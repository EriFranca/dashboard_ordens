// Gerenciamento de armazenamento de customizações de materiais
// Usa localStorage no cliente para persistir alterações

export type MaterialCustom = {
  descricao: string
  categoria: string
}

const STORAGE_KEY = 'dashboard_materiais_custom'

/**
 * Carrega customizações de materiais do localStorage
 */
export function loadMaterialsCustom(): Record<string, MaterialCustom> {
  if (typeof window === 'undefined') return {}
  
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    return stored ? JSON.parse(stored) : {}
  } catch (e) {
    console.error('Erro ao carregar materiais customizados:', e)
    return {}
  }
}

/**
 * Salva customizações de materiais no localStorage
 */
export function saveMaterialsCustom(custom: Record<string, MaterialCustom>): void {
  if (typeof window === 'undefined') return
  
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(custom))
  } catch (e) {
    console.error('Erro ao salvar materiais customizados:', e)
  }
}

/**
 * Adiciona ou atualiza uma customização de material
 */
export function updateMaterialCustom(
  codigo: string,
  descricao: string,
  categoria: string,
): void {
  const custom = loadMaterialsCustom()
  custom[codigo] = { descricao, categoria }
  saveMaterialsCustom(custom)
}

/**
 * Remove a customização de um material
 */
export function removeMaterialCustom(codigo: string): void {
  const custom = loadMaterialsCustom()
  delete custom[codigo]
  saveMaterialsCustom(custom)
}

/**
 * Exporta todas as customizações como JSON
 */
export function exportMaterialsCustom(): string {
  const custom = loadMaterialsCustom()
  return JSON.stringify(custom, null, 2)
}

/**
 * Importa customizações de um JSON
 */
export function importMaterialsCustom(jsonStr: string): void {
  try {
    const custom = JSON.parse(jsonStr)
    saveMaterialsCustom(custom)
  } catch (e) {
    console.error('Erro ao importar materiais customizados:', e)
    throw new Error('JSON inválido')
  }
}
