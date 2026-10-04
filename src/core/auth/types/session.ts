export type HorizonUser = {
  id: string
  email: string
  name: string
  role: { id: string; label: string; permissions: readonly string[] }
}
export type Session =
  | { status: 'anonymous'; error?: string }
  | { status: 'authenticated'; user: HorizonUser }

export function hasPermission(user: HorizonUser, permission: string): boolean {
  return user.role.permissions.includes(permission)
}
