import { useSyncExternalStore } from 'react'
import { useQuery } from '@tanstack/react-query'
import { sessionService } from '../../../core/auth/services/session'
import { libraryService } from '../services/LibraryService'
export function useLibraryAccess() {
  const session = useSyncExternalStore(sessionService.subscribe, sessionService.getSnapshot)
  const user = session.status === 'authenticated' ? session.user : undefined
  const can = (action: string) => Boolean(user?.role.permissions.includes('documents.read') && (action === 'read' || user.erpProfile !== 'viewer' && user.role.permissions.includes(`documents.${action}`)))
  return { user, key: `${user?.id || ''}:${user?.accessRevision || ''}`, canRead: can('read'), canWrite: can('write'), canManage: can('manage'), canSettings: can('settings') && Boolean(user && ['admin', 'superuser'].includes(user.erpProfile || '') && user.role.permissions.includes('settings.references')) }
}
export function useLibraryChoices(enabled = true) { const access = useLibraryAccess(); return useQuery({ queryKey: ['ged', 'choices', access.key], queryFn: () => libraryService.choices(), enabled: enabled && access.canRead, retry: false, staleTime: 60_000 }) }

export function useLibraryContext(entity: string, id: string) { const access = useLibraryAccess(); return useQuery({ queryKey: ['ged', 'context', access.key, entity, id], queryFn: () => libraryService.context(entity, id), enabled: access.canRead && Boolean(id), retry: false, staleTime: 60_000 }) }
