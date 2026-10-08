import { hasPermission, type HorizonUser } from '../core/auth/types/session'
export function canAccessNavigation(href: string, user?: HorizonUser) {
  if (!user) return true
  if (href === '/' || href === '/account' || href === '/calendar') return true
  if (href === '/settings') return ['admin', 'superuser'].includes(user.erpProfile || 'user')
  const permission = ({ '/contacts': 'contacts.read', '/crm': 'crm.read', '/sales': 'sales.read', '/hr': 'hr.read' } as Record<string, string>)[href]
  if (permission) return hasPermission(user, permission)
  return ['admin', 'superuser'].includes(user.erpProfile || 'user')
}
