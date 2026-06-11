import { createContext, useContext, useState, useCallback, type ReactNode } from "react"
import {
  loadConversoesUN,
  saveConversoesUN,
  conversoesParaKg,
  type ConversaoItem,
} from "./conversoes-storage"

type ConversoesContextValue = {
  conversoesUN: Record<string, ConversaoItem>
  conversoesKg: Record<string, number>
  addConversao: (codigo: string, gramas: number) => void
  removeConversao: (codigo: string) => void
}

const ConversoesContext = createContext<ConversoesContextValue | null>(null)

export function ConversoesProvider({ children }: { children: ReactNode }) {
  const [conversoesUN, setConversoesUN] = useState<Record<string, ConversaoItem>>(loadConversoesUN)

  const conversoesKg = conversoesParaKg(conversoesUN)

  const addConversao = useCallback((codigo: string, gramas: number) => {
    setConversoesUN((prev) => {
      const next = { ...prev, [codigo]: { gramas } }
      saveConversoesUN(next)
      return next
    })
  }, [])

  const removeConversao = useCallback((codigo: string) => {
    setConversoesUN((prev) => {
      const next = { ...prev }
      delete next[codigo]
      saveConversoesUN(next)
      return next
    })
  }, [])

  return (
    <ConversoesContext.Provider value={{ conversoesUN, conversoesKg, addConversao, removeConversao }}>
      {children}
    </ConversoesContext.Provider>
  )
}

export function useConversoesKg() {
  const ctx = useContext(ConversoesContext)
  if (!ctx) throw new Error("useConversoesKg must be used within ConversoesProvider")
  return ctx
}
