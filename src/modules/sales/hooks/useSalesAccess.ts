import { useSyncExternalStore } from 'react'
import { sessionService } from '../../../core/auth/services/session'
import { hasPermission } from '../../../core/auth/types/session'
export function useSalesAccess() {
  const session = useSyncExternalStore(sessionService.subscribe, sessionService.getSnapshot)
  return { canFinalize: session.status === 'authenticated' && session.user.erpProfile !== 'viewer' && hasPermission(session.user, 'sales.quote.validate'), canConfirm: session.status === 'authenticated' && session.user.erpProfile !== 'viewer' && hasPermission(session.user, 'sales.order.confirm'), canRead: session.status === 'authenticated' && hasPermission(session.user, 'sales.read'), canWrite: session.status === 'authenticated' && hasPermission(session.user, 'sales.write'), canWriteCrm: session.status === 'authenticated' && session.user.erpProfile !== 'viewer' && hasPermission(session.user, 'crm.read') && hasPermission(session.user, 'crm.write'), canReadCrm: session.status === 'authenticated' && hasPermission(session.user, 'crm.read') }
}
