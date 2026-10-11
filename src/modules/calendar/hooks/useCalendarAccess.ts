import { useSyncExternalStore } from 'react'
import { sessionService } from '../../../core/auth/services/session'
import { hasPermission } from '../../../core/auth/types/session'
export function useCalendarAccess() {
  const session = useSyncExternalStore(sessionService.subscribe, sessionService.getSnapshot)
  return { canWrite: session.status === 'authenticated' && session.user.erpProfile !== 'viewer' && hasPermission(session.user, 'calendar.read') && hasPermission(session.user, 'calendar.write') }
}
