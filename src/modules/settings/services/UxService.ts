import { ClientResponseError } from 'pocketbase'
import { environment } from '../../../core/config/environment'
import { sessionService } from '../../../core/auth/services/session'
import { hasPermission } from '../../../core/auth/types/session'
import { createUxRepository } from '../repositories/UxRepository'
import { uxInputSchema, type UxInput } from '../schemas/ux'
const repository = environment.pocketBaseUrl ? createUxRepository(environment.pocketBaseUrl) : undefined
async function run<T>(write: boolean, action: (repo: ReturnType<typeof createUxRepository>) => Promise<T>) {
  const session = sessionService.getSnapshot()
  if (session.status !== 'authenticated' || write && !hasPermission(session.user, 'settings.references')) throw new Error('Accès aux réglages UX refusé.')
  if (!repository) throw new Error('Paramètres UX non configurés.')
  try { return await action(repository) }
  catch (error) {
    console.error('[ux] Settings operation failed', { status: error instanceof ClientResponseError ? error.status : 0 })
    throw new Error(error instanceof ClientResponseError && [400, 403, 409].includes(error.status) ? error.response.message : 'Réglages UX indisponibles. Vérifiez la migration puis réessayez.', { cause: error })
  }
}
export const uxService = {
  read: () => run(false, (repo) => repo.read()),
  save: (updated: string, config: UxInput) => run(true, (repo) => repo.save(updated, uxInputSchema.parse(config))),
  watch: (refresh: () => void) => run(false, (repo) => repo.watch(refresh)),
}
