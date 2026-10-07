import { hasPermission } from '../../../core/auth/types/session'
import { useSyncExternalStore } from 'react'
import { useQuery } from '@tanstack/react-query'
import { sessionService } from '../../../core/auth/services/session'
import { crmService } from '../services/CrmService'
export function useCrmAccess() {
  const session = useSyncExternalStore(sessionService.subscribe, sessionService.getSnapshot)
  const canRead = session.status === 'authenticated' && hasPermission(session.user, 'crm.read')
  return { canRead, canWrite: canRead && session.status === 'authenticated' && hasPermission(session.user, 'crm.write'), canReadContacts: session.status === 'authenticated' && hasPermission(session.user, 'contacts.read'), userId: session.status === 'authenticated' ? session.user.id : '' }
}
export function useCrmReferences(enabled: boolean) {
  const stages = useQuery({ queryKey: ['crm', 'stages'], queryFn: () => crmService.stages(), enabled, retry: false })
  const owners = useQuery({ queryKey: ['crm', 'owners'], queryFn: () => crmService.owners(), enabled, retry: false })
  return { stages, owners }
}
