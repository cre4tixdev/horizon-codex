import { useSyncExternalStore } from 'react'
import { sessionService } from '../../../core/auth/services/session'
import { hasPermission } from '../../../core/auth/types/session'
export function useCatalogAccess() {
  const session = useSyncExternalStore(sessionService.subscribe, sessionService.getSnapshot)
  const has = (permission: string) => session.status === 'authenticated' && hasPermission(session.user, permission)
  return { canRead: has('inventory.read'), canWrite: has('inventory.write') && session.status === 'authenticated' && session.user.erpProfile !== 'viewer', canReadContacts: has('contacts.read'), canWriteContacts: has('contacts.write'), canSettings: has('settings.references') && session.status === 'authenticated' && ['admin', 'superuser'].includes(session.user.erpProfile || '') }
}
