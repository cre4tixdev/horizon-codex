import { ClientResponseError } from 'pocketbase'
import { environment } from '../../../core/config/environment'
import { sessionService } from '../../../core/auth/services/session'
import { hasPermission } from '../../../core/auth/types/session'
import type { MergeKind } from '../../../shared/merge/schema'
import { createQualityRepository } from '../repositories/QualityRepository'
const repository = environment.pocketBaseUrl ? createQualityRepository(environment.pocketBaseUrl) : undefined
export const qualityService = {
  async list(kind: MergeKind, query: Record<string, string | number>) {
    const session = sessionService.getSnapshot(), domain = kind === 'products' ? 'inventory' : 'contacts'
    if (session.status !== 'authenticated' || session.user.erpProfile === 'viewer' || ['read', 'write', 'merge'].some((action) => !hasPermission(session.user, `${domain}.${action}`))) throw new Error('Les droits de consultation, modification et fusion du domaine sont nécessaires.')
    if (!repository) throw new Error('PocketBase non configuré.')
    try { return await repository.list({ ...query, kind }) } catch (error) {
      console.error('[data-quality] Lookup failed', { status: error instanceof ClientResponseError ? error.status : 0 })
      throw new Error(error instanceof ClientResponseError && error.status === 404 ? 'Mise à jour PocketBase requise pour l’assistant de fusion.' : error instanceof ClientResponseError && [400, 403].includes(error.status) ? error.response.message : 'Recherche des fiches indisponible. Réessayez.', { cause: error })
    }
  },
}
