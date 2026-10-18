import { useSyncExternalStore } from 'react'
import { useQuery } from '@tanstack/react-query'
import { sessionService } from '../../core/auth/services/session'
import { tableColumnPoliciesService } from '../../core/preferences/TableColumnPoliciesService'
export const tableColumnPoliciesQueryKey = ['table-column-policies']
export function useTableColumnPolicies(enabled = true) {
  const session = useSyncExternalStore(sessionService.subscribe, sessionService.getSnapshot)
  return useQuery({ queryKey: [...tableColumnPoliciesQueryKey, session.status === 'authenticated' ? session.user.id : ''], queryFn: () => tableColumnPoliciesService.read(), enabled: enabled && session.status === 'authenticated', retry: false, staleTime: 0 })
}
