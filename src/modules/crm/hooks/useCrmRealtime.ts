import { useEffect, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { tenderService } from '../services/TenderService'

// Refresh collections and calendar projections; never reset an open draft editor.
export function useCrmRealtime(enabled: boolean) {
  const client = useQueryClient()
  const [error, setError] = useState<string>()
  useEffect(() => {
    if (!enabled) return
    let disposed = false
    let stop: (() => Promise<void>) | undefined
    void tenderService.watch(() => {
      void client.invalidateQueries({ queryKey: ['crm', 'opportunities'] })
      void client.invalidateQueries({ queryKey: ['crm', 'summary'] })
      void client.invalidateQueries({ queryKey: ['calendar'] })
      void client.invalidateQueries({ queryKey: ['references', 'crm_tender_statuses'] })
      void client.invalidateQueries({ queryKey: ['references', 'crm_tender_tags'] })
    }).then((unsubscribe) => {
      if (disposed) void unsubscribe()
      else { stop = unsubscribe; setError(undefined) }
    }).catch((reason: unknown) => { if (!disposed) setError(reason instanceof Error ? reason.message : 'La mise à jour en temps réel est indisponible.') })
    return () => { disposed = true; if (stop) void stop() }
  }, [client, enabled])
  return enabled ? error : undefined
}
