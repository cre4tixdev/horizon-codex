import { useSyncExternalStore } from 'react'
import { sessionService } from '../../../core/auth/services/session'
import { hasPermission } from '../../../core/auth/types/session'
export function useExpensesAccess() {
  const session = useSyncExternalStore(sessionService.subscribe, sessionService.getSnapshot)
  const can = (action: string) => session.status === 'authenticated' && (action === 'read' || session.user.erpProfile !== 'viewer') && hasPermission(session.user, `expenses.${action}`)
  return { userId: session.status === 'authenticated' ? session.user.id : '', canRead: can('read'), canWrite: can('write'), canSubmit: can('submit'), canValidate: can('validate'), canReimburse: can('reimburse') }
}
