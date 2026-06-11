const STORAGE_KEY = "dashboard_conversoes_un_kg"

export type ConversaoItem = {
  gramas: number
}

const PADROES: Record<string, ConversaoItem> = {
  "254410": { gramas: 400 },
  "251064": { gramas: 150 },
  "254509": { gramas: 400 },
  "255127": { gramas: 150 },
  "251062": { gramas: 150 },
  "251061": { gramas: 150 },
  "251065": { gramas: 150 },
  "251063": { gramas: 150 },
  "255378": { gramas: 150 },
}

export function loadConversoesUN(): Record<string, ConversaoItem> {
  if (typeof window === "undefined") return PADROES
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    return stored ? JSON.parse(stored) : PADROES
  } catch {
    return PADROES
  }
}

export function saveConversoesUN(map: Record<string, ConversaoItem>): void {
  if (typeof window === "undefined") return
  localStorage.setItem(STORAGE_KEY, JSON.stringify(map))
}

export function conversoesParaKg(map: Record<string, ConversaoItem>): Record<string, number> {
  const result: Record<string, number> = {}
  for (const [codigo, { gramas }] of Object.entries(map)) {
    result[codigo] = gramas / 1000
  }
  return result
}
