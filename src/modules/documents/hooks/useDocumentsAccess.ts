import { useSyncExternalStore } from 'react'
import { sessionService } from '../../../core/auth/services/session'
import { hasPermission } from '../../../core/auth/types/session'
export function useDocumentsAccess() {
  const session = useSyncExternalStore(sessionService.subscribe, sessionService.getSnapshot)
  return { canManage: session.status === 'authenticated' && hasPermission(session.user, 'documents.template.manage') && hasPermission(session.user, 'settings.references'), canPreview: session.status === 'authenticated' && hasPermission(session.user, 'sales.read') }
}
