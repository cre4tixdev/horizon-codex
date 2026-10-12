import { useSyncExternalStore } from 'react'
import { sessionService } from '../../../core/auth/services/session'
import { hasPermission } from '../../../core/auth/types/session'
export function useAnalysisAccess() {
  const session = useSyncExternalStore(sessionService.subscribe, sessionService.getSnapshot)
  return { accessKey: session.status === 'authenticated' ? `${session.user.id}:${session.user.accessRevision || ''}:${session.user.role.permissions.join(',')}` : '', canRead: session.status === 'authenticated' && (session.user.erpProfile === 'admin' || hasPermission(session.user, 'analysis.read')), canReadCrm: session.status === 'authenticated' && hasPermission(session.user, 'crm.read'), canReadSales: session.status === 'authenticated' && hasPermission(session.user, 'sales.read') }
}
