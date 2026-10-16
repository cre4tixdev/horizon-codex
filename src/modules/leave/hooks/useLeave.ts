import { useSyncExternalStore } from 'react'
import { useQuery } from '@tanstack/react-query'
import { sessionService } from '../../../core/auth/services/session'
import { hasPermission } from '../../../core/auth/types/session'
import { leaveService } from '../services/LeaveService'
export function useLeaveAccess() {
  const session = useSyncExternalStore(sessionService.subscribe, sessionService.getSnapshot)
  const can = (action: string) => session.status === 'authenticated' && (action === 'read' || session.user.erpProfile !== 'viewer') && hasPermission(session.user, `leave.${action}`)
  return { canRead: can('read'), canWrite: can('write'), userId: session.status === 'authenticated' ? session.user.id : '' }
}
export function useLeaveChoices(enabled: boolean) { return useQuery({ queryKey: ['leave', 'choices'], queryFn: leaveService.choices, enabled, retry: false, refetchInterval: 30_000 }) }
