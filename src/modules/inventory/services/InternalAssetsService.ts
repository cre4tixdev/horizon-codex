import { ClientResponseError } from 'pocketbase'
import { environment } from '../../../core/config/environment'
import { sessionService } from '../../../core/auth/services/session'
import { hasPermission } from '../../../core/auth/types/session'
import { createInternalAssetsRepository } from '../repositories/InternalAssetsRepository'
import { internalAssetInputSchema, type AssetQuery, type InternalAssetInput } from '../schemas/internalAssets'
const repository = environment.pocketBaseUrl ? createInternalAssetsRepository(environment.pocketBaseUrl) : undefined
async function run<T>(right: string, fn: (repo: ReturnType<typeof createInternalAssetsRepository>) => Promise<T>) {
  const session = sessionService.getSnapshot()
  if (!repository || session.status !== 'authenticated' || !hasPermission(session.user, right)) throw new Error('Accès au parc interne refusé.')
  try { return await fn(repository) } catch (error) { console.error('[internal-assets] Operation failed', { status: error instanceof ClientResponseError ? error.status : 0 }); throw new Error(error instanceof ClientResponseError && [400, 403, 404, 409].includes(error.status) ? error.response.message : 'Parc interne indisponible. Réessayez.', { cause: error }) }
}
export const internalAssetsService = {
  list: (query: AssetQuery) => run('inventory.read', (repo) => repo.list(query)),
  record: (id: string) => run('inventory.read', (repo) => repo.record(id)),
  save: (id: string, updated: string, input: InternalAssetInput, action: 'save' | 'return_stock' = 'save') => run(action === 'save' ? 'inventory.write' : 'inventory.stock.validate', (repo) => repo.save(id, updated, internalAssetInputSchema.parse(input), action)),
}
