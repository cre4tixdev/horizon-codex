export type HorizonUser = {
  id: string
  email: string
  name: string
  erpProfile?: 'admin' | 'superuser' | 'user' | 'viewer'
  accessRevision?: string
  role: { id: string; label: string; permissions: readonly string[] }
}
export type Session =
  | { status: 'anonymous'; error?: string }
  | { status: 'authenticated'; user: HorizonUser }

export function hasPermission(user: HorizonUser, permission: string): boolean {
  if (permission.startsWith('settings.') && !['admin', 'superuser'].includes(user.erpProfile || 'user')) return false
  if (['settings.users', 'settings.roles'].includes(permission) && user.erpProfile !== 'admin') return false
  if (user.erpProfile === 'viewer' && /\.(write|create|update|validate|archive|delete|manage)$/.test(permission)) return false
  return user.role.permissions.includes(permission)
}
