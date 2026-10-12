import { ClientResponseError } from 'pocketbase'
import { environment } from '../../../core/config/environment'
import { sessionService } from '../../../core/auth/services/session'
import { hasPermission } from '../../../core/auth/types/session'
import { createFixedAssetsRepository } from '../repositories/FixedAssetsRepository'
import { fixedAssetInputSchema, type FixedAssetInput } from '../schemas/fixedAssets'
const repository = environment.pocketBaseUrl ? createFixedAssetsRepository(environment.pocketBaseUrl) : undefined
export function fixedAssetsAccess() { const session = sessionService.getSnapshot(), can = (right: string) => session.status === 'authenticated' && (session.user.erpProfile === 'admin' || hasPermission(session.user, right)); return { accessKey: session.status === 'authenticated' ? `${session.user.id}:${session.user.accessRevision || ''}:${session.user.role.permissions.join(',')}` : '', canRead: can('accounting.read'), canManage: can('accounting.assets.manage'), canPurchase: session.status === 'authenticated' && hasPermission(session.user, 'purchasing.read') && hasPermission(session.user, 'purchasing.write') } }
async function run<T>(write: boolean, fn: (repo: ReturnType<typeof createFixedAssetsRepository>) => Promise<T>) {
  const access = fixedAssetsAccess()
  if (!repository || !access.canRead || write && !access.canManage) throw new Error('Accès aux immobilisations refusé.')
  try { return await fn(repository) } catch (error) { console.error('[fixed-assets] Operation failed', { status: error instanceof ClientResponseError ? error.status : 0 }); throw new Error(error instanceof ClientResponseError && [400, 403, 404, 409].includes(error.status) ? error.response.message : 'Immobilisations indisponibles. Réessayez.', { cause: error }) }
}
export const fixedAssetsService = {
  list: (query: { q: string; status: string; page: number; sort?: string }) => run(false, (repo) => repo.list(query)),
  record: (id: string) => run(false, (repo) => repo.record(id)),
  save: (id: string, updated: string, input: FixedAssetInput, action: 'save' | 'register' | 'dispose' = 'save') => run(true, (repo) => repo.save(id, updated, fixedAssetInputSchema.parse(input), action)),
}
