import { useEffect, useState, useSyncExternalStore } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { sessionService } from '../../../core/auth/services/session'
import { uxService } from '../services/UxService'
import { uxDefaults, uxStyle, uxQueryKey } from '../schemas/ux'
import { HButton } from '../../../shared/ui/HButton'
/** Apply only saved values; the editor scopes its draft to its preview. */
export function UxPreferences() {
  const session = useSyncExternalStore(sessionService.subscribe, sessionService.getSnapshot)
  const enabled = session.status === 'authenticated', client = useQueryClient()
  const query = useQuery({ queryKey: uxQueryKey, queryFn: uxService.read, enabled, retry: false, staleTime: 60_000 })
  const [watchError, setWatchError] = useState<string>()
  const [watchAttempt, setWatchAttempt] = useState(0)
  useEffect(() => {
    if (!enabled) return
    let disposed = false, stop: (() => Promise<void>) | undefined
    void uxService.watch(() => { void client.invalidateQueries({ queryKey: uxQueryKey }) }).then((unsubscribe) => {
      if (disposed) void unsubscribe()
      else { stop = unsubscribe; setWatchError(undefined) }
    }).catch((error: unknown) => { if (!disposed) setWatchError(error instanceof Error ? error.message : 'Actualisation UX indisponible.') })
    return () => { disposed = true; if (stop) void stop() }
  }, [client, enabled, watchAttempt])
  useEffect(() => {
    const style = uxStyle(enabled && query.data ? query.data.config : uxDefaults)
    for (const [key, value] of Object.entries(style)) document.documentElement.style.setProperty(key, value)
    return () => { for (const key of Object.keys(style)) document.documentElement.style.removeProperty(key) }
  }, [enabled, query.data])
  return query.error || watchError ? <div className="ux-load-error" role="alert">{query.error?.message || watchError}<HButton size="small" onClick={() => { void query.refetch(); setWatchAttempt((attempt) => attempt + 1) }}>Réessayer</HButton></div> : null
}
