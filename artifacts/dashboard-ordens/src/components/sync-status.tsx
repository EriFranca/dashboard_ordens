
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { AlertCircle, RefreshCw, Clock } from 'lucide-react'
import { useSyncScheduler } from '@/lib/hooks/useSyncScheduler'

export function SyncStatus() {
  const { lastSync, nextSync, isSyncing, error, lastSyncDuration, performSync, formatNextSync } =
    useSyncScheduler()

  const handleManualSync = async () => {
    await performSync()
  }

  return (
    <Card className="p-4">
      <div className="flex flex-col gap-3">
        {/* Title */}
        <div className="flex items-center gap-2">
          <Clock className="size-4 text-primary" />
          <h3 className="font-medium text-sm">Status de Sincronização SAP</h3>
        </div>

        {/* Status Info */}
        <div className="grid grid-cols-2 gap-3 text-xs">
          <div>
            <p className="text-muted-foreground">Último sync</p>
            <p className="font-mono text-foreground">
              {lastSync
                ? new Intl.DateTimeFormat('pt-BR', {
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  }).format(lastSync)
                : 'Nunca'}
            </p>
          </div>
          <div>
            <p className="text-muted-foreground">Próximo sync</p>
            <p className="font-mono text-foreground">{formatNextSync(nextSync)}</p>
          </div>
        </div>

        {/* Duration */}
        {lastSyncDuration && (
          <div className="rounded-md bg-muted/50 px-2 py-1.5 text-xs text-muted-foreground">
            Duração: <span className="font-mono font-medium">{lastSyncDuration}ms</span>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="flex gap-2 rounded-md bg-destructive/10 px-2 py-1.5">
            <AlertCircle className="size-4 shrink-0 text-destructive" />
            <p className="text-xs text-destructive">{error}</p>
          </div>
        )}

        {/* Actions */}
        <Button
          size="sm"
          variant="outline"
          onClick={handleManualSync}
          disabled={isSyncing}
          className="w-full gap-2"
        >
          <RefreshCw className={`size-3 ${isSyncing ? 'animate-spin' : ''}`} />
          {isSyncing ? 'Sincronizando...' : 'Sincronizar Agora'}
        </Button>

        {/* Info */}
        <p className="text-xs text-muted-foreground">
          Sincronização automática diária às <span className="font-mono font-medium">21:00</span>
        </p>
      </div>
    </Card>
  )
}
