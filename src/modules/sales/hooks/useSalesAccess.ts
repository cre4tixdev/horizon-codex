import { useSyncExternalStore } from 'react'
import { sessionService } from '../../../core/auth/services/session'
import { hasPermission } from '../../../core/auth/types/session'
export function useSalesAccess() {
  const session = useSyncExternalStore(sessionService.subscribe, sessionService.getSnapshot)
  return { canRead: session.status === 'authenticated' && hasPermission(session.user, 'sales.read'), canWrite: session.status === 'authenticated' && hasPermission(session.user, 'sales.write'), canReadCrm: session.status === 'authenticated' && hasPermission(session.user, 'crm.read') }
}
