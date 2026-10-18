import { useSyncExternalStore } from 'react'
import { useQuery } from '@tanstack/react-query'
import { sessionService } from '../../../core/auth/services/session'
import { hasPermission } from '../../../core/auth/types/session'
import { timeService } from '../services/TimeService'
export function useTimeAccess() {
  const session = useSyncExternalStore(sessionService.subscribe, sessionService.getSnapshot)
  const can = (action: string) => session.status === 'authenticated' && hasPermission(session.user, 'time.read') && hasPermission(session.user, `time.${action}`) && (action === 'read' || session.user.erpProfile !== 'viewer')
  return { canRead: can('read'), canWrite: can('write'), canSettings: can('settings'), userId: session.status === 'authenticated' ? session.user.id : '' }
}
export function useTimeChoices(enabled: boolean) { return useQuery({ queryKey: ['time', 'choices'], queryFn: timeService.choices, enabled, retry: false }) }
