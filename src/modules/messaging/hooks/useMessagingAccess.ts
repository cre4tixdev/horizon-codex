import { useSyncExternalStore } from 'react'
import { sessionService } from '../../../core/auth/services/session'
import { hasPermission } from '../../../core/auth/types/session'
export function useMessagingAccess() {
  const session = useSyncExternalStore(sessionService.subscribe, sessionService.getSnapshot)
  const can = (action: string) => session.status === 'authenticated' && hasPermission(session.user, 'messaging.read') && hasPermission(session.user, `messaging.${action}`) && (action === 'read' || session.user.erpProfile !== 'viewer')
  return { canRead: can('read'), canWrite: can('write'), canSend: can('send'), canSettings: can('settings') && session.status === 'authenticated' && ['admin', 'superuser'].includes(session.user.erpProfile || 'user') }
}
