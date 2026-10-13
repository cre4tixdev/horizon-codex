import { useSyncExternalStore } from 'react'
import { sessionService } from '../../../core/auth/services/session'
import { hasPermission } from '../../../core/auth/types/session'
export function useBillingAccess() {
  const session = useSyncExternalStore(sessionService.subscribe, sessionService.getSnapshot)
  const can = (right: string) => session.status === 'authenticated' && hasPermission(session.user, right)
  const canRead = can('billing.read'), editable = session.status === 'authenticated' && session.user.erpProfile !== 'viewer'
  return { canRead, canWrite: canRead && editable && can('billing.write'), canValidate: canRead && editable && can('billing.invoice.validate'), canPay: canRead && editable && can('billing.payment.manage'), canSettings: can('settings.references') && session.status === 'authenticated' && ['admin', 'superuser'].includes(session.user.erpProfile || '') }
}
