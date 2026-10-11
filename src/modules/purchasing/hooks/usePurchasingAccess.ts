import { useSyncExternalStore } from 'react'
import { sessionService } from '../../../core/auth/services/session'
import { hasPermission } from '../../../core/auth/types/session'
export function usePurchasingAccess() {
  const session = useSyncExternalStore(sessionService.subscribe, sessionService.getSnapshot)
  const can = (permission: string) => session.status === 'authenticated' && hasPermission(session.user, permission)
  return { canRead: can('purchasing.read'), canWrite: can('purchasing.write'), canValidateRequest: can('purchasing.request.validate'), canValidateOrder: can('purchasing.order.validate'), canReadSales: can('sales.read'), canReadProducts: can('inventory.read'), canCreateProducts: can('inventory.write'), canReadCrm: can('crm.read'), canWriteCrm: can('crm.write'), canReadContacts: can('contacts.read'), canWriteContacts: can('contacts.write'), canConfigure: can('settings.references') }
}
