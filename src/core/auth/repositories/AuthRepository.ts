import { ClientResponseError } from 'pocketbase'
import { createPocketBaseClient } from '../../pocketbase/client'
import { userSchema, type LoginInput } from '../schemas/auth'
import type { HorizonUser } from '../types/session'
import { AuthError } from '../services/AuthError'

export interface AuthRepository {
  hasSession(): boolean
  signIn(input: LoginInput): Promise<HorizonUser>
  refresh(): Promise<HorizonUser>
  signOut(): void
}

export function createAuthRepository(url: string): AuthRepository {
  const client = createPocketBaseClient(url)
  function parseUser(value: unknown): HorizonUser {
    const result = userSchema.safeParse(value)
    if (!result.success) {
      client.authStore.clear()
      console.error('[auth] Invalid server session shape')
      throw new AuthError('invalid-session')
    }
    const user = result.data
    return { id: user.id, email: user.email, name: user.name, erpProfile: user.erp_profile, accessRevision: user.updated,
      role: { id: user.role, label: user.expand.role.label, permissions: user.expand.role.permissions } }
  }
  function failure(error: unknown, refresh: boolean): never {
    if (error instanceof AuthError) throw error
    const status = error instanceof ClientResponseError ? error.status : 0
    if (status === 404) throw new AuthError('installation')
    if (status === 400 || status === 401 || status === 403) {
      client.authStore.clear()
      throw new AuthError(refresh ? 'invalid-session' : 'credentials')
    }
    // Do not log the SDK error: it may contain the submitted password or token.
    console.error('[auth] Request failed', { status })
    throw new AuthError('unavailable')
  }
  return {
    hasSession: () => client.authStore.isValid,
    async signIn(input) {
      try {
        const result = await client.collection('core_users').authWithPassword(input.email, input.password, { expand: 'role' })
        return parseUser(result.record)
      } catch (error) { return failure(error, false) }
    },
    async refresh() {
      try {
        const result = await client.collection('core_users').authRefresh({ expand: 'role' })
        return parseUser(result.record)
      } catch (error) { return failure(error, true) }
    },
    signOut() { client.cancelAllRequests(); client.authStore.clear() },
  }
}
