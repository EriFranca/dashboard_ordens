'use client'

import { useEffect, useState, useCallback } from 'react'

interface SyncStatus {
  lastSync: Date | null
  nextSync: Date | null
  isSyncing: boolean
  error: string | null
  lastSyncDuration: number | null
}

interface UseSyncSchedulerOptions {
  enabled?: boolean
  timeOfDay?: string // HH:mm format (default: 21:00)
}

/**
 * Hook para gerenciar sincronização automática com SAP
 * Sincroniza dados uma vez por dia no horário especificado (padrão: 21:00)
 */
export function useSyncScheduler(options: UseSyncSchedulerOptions = {}) {
  const { enabled = true, timeOfDay = '21:00' } = options

  const [status, setStatus] = useState<SyncStatus>({
    lastSync: null,
    nextSync: null,
    isSyncing: false,
    error: null,
    lastSyncDuration: null,
  })

  // Carregar último sync do localStorage
  const loadLastSync = useCallback(() => {
    try {
      const stored = localStorage.getItem('sap_last_sync')
      if (stored) {
        const parsed = JSON.parse(stored)
        return {
          date: new Date(parsed.date),
          duration: parsed.duration,
        }
      }
    } catch (err) {
      console.error('Erro ao carregar último sync:', err)
    }
    return null
  }, [])

  // Calcular próximo sync
  const calculateNextSync = useCallback((lastSyncTime?: Date) => {
    const now = new Date()
    const [hours, minutes] = timeOfDay.split(':').map(Number)

    let nextSyncTime = new Date(now)
    nextSyncTime.setHours(hours, minutes, 0, 0)

    // Se o horário já passou hoje, agendar para amanhã
    if (nextSyncTime <= now) {
      nextSyncTime.setDate(nextSyncTime.getDate() + 1)
    }

    return nextSyncTime
  }, [timeOfDay])

  // Sincronizar com SAP
  const performSync = useCallback(async () => {
    if (status.isSyncing) return

    const startTime = performance.now()
    setStatus((prev) => ({ ...prev, isSyncing: true, error: null }))

    try {
      const response = await fetch('/api/sap/sync', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        throw new Error(`Sync failed: ${response.statusText}`)
      }

      const duration = Math.round(performance.now() - startTime)
      const now = new Date()

      // Salvar no localStorage
      localStorage.setItem(
        'sap_last_sync',
        JSON.stringify({
          date: now.toISOString(),
          duration,
        })
      )

      const nextSync = calculateNextSync(now)

      setStatus({
        lastSync: now,
        nextSync,
        isSyncing: false,
        error: null,
        lastSyncDuration: duration,
      })

      console.log(`✅ SAP sync completed in ${duration}ms`)
      return true
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido'
      console.error('❌ SAP sync failed:', errorMessage)

      setStatus((prev) => ({
        ...prev,
        isSyncing: false,
        error: errorMessage,
      }))
      return false
    }
  }, [status.isSyncing, calculateNextSync])

  // Setup inicial e scheduler
  useEffect(() => {
    if (!enabled) return

    // Carregar último sync
    const lastSyncData = loadLastSync()
    if (lastSyncData) {
      const nextSync = calculateNextSync(lastSyncData.date)
      setStatus((prev) => ({
        ...prev,
        lastSync: lastSyncData.date,
        nextSync,
        lastSyncDuration: lastSyncData.duration,
      }))
    } else {
      // Se nunca sincronizou, calcular primeiro sync
      const nextSync = calculateNextSync()
      setStatus((prev) => ({
        ...prev,
        nextSync,
      }))
    }

    // Criar interval para verificar se é hora de sincronizar
    const intervalId = setInterval(() => {
      const now = new Date()
      const [hours, minutes] = timeOfDay.split(':').map(Number)

      // Verificar se estamos perto do horário (dentro de 1 minuto)
      if (now.getHours() === hours && now.getMinutes() === minutes) {
        // Verificar se já sincronizou hoje
        const lastSync = loadLastSync()
        if (!lastSync || lastSync.date.toDateString() !== now.toDateString()) {
          performSync()
        }
      }
    }, 60000) // Verificar a cada minuto

    return () => clearInterval(intervalId)
  }, [enabled, timeOfDay, loadLastSync, calculateNextSync, performSync])

  return {
    ...status,
    performSync,
    formatNextSync: (nextSync: Date | null) => {
      if (!nextSync) return 'Nunca'
      return new Intl.DateTimeFormat('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }).format(nextSync)
    },
  }
}
