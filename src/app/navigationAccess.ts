import { hasPermission, type HorizonUser } from '../core/auth/types/session'
export function canAccessNavigation(href: string, user?: HorizonUser) {
  if (!user) return true
  if (href === '/' || href === '/account' || href === '/calendar') return true
  if (href.startsWith('/accounting')) return user.erpProfile === 'admin' || hasPermission(user, 'accounting.read')
  if (href === '/analysis') return user.erpProfile === 'admin' || hasPermission(user, 'analysis.read')
  if (href === '/settings') return ['admin', 'superuser'].includes(user.erpProfile || 'user') || user.erpProfile !== 'viewer' && hasPermission(user, 'leave.read') && hasPermission(user, 'leave.settings')
  const permission = ({ '/contacts': 'contacts.read', '/crm': 'crm.read', '/purchasing': 'purchasing.read', '/sales': 'sales.read', '/inventory': 'inventory.read', '/inventory/dashboard': 'inventory.read', '/hr': 'hr.read', '/leave': 'leave.read', '/expenses': 'expenses.read' } as Record<string, string>)[href]
  if (permission) return hasPermission(user, permission)
  return ['admin', 'superuser'].includes(user.erpProfile || 'user')
}
