import { useSyncExternalStore } from 'react'
import { sessionService } from '../../../core/auth/services/session'
import { hasPermission } from '../../../core/auth/types/session'
export function useStockAccess() {
  const session = useSyncExternalStore(sessionService.subscribe, sessionService.getSnapshot)
  const can = (right: string) => session.status === 'authenticated' && hasPermission(session.user, right)
  return { accessKey: session.status === 'authenticated' ? `${session.user.id}:${session.user.accessRevision || ''}:${session.user.role.permissions.join(',')}` : '', canPurchase: can('purchasing.read') && can('purchasing.write'), canWrite: can('inventory.write'), canValidate: can('inventory.stock.validate'), canRead: can('inventory.read'), canReserve: can('inventory.stock.reserve'), canAdjust: can('inventory.stock.adjust'), canConfigure: can('settings.references') }
}
