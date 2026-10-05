import { environment } from '../../../core/config/environment'
import { sessionService } from '../../../core/auth/services/session'
import { hasPermission } from '../../../core/auth/types/session'
import { createReferencesRepository } from '../repositories/ReferencesRepository'
import { referenceInputSchema } from '../schemas/references'
import type { CatalogName, ReferenceInput } from '../types/references'
const repository = environment.pocketBaseUrl ? createReferencesRepository(environment.pocketBaseUrl) : undefined
export const referencesService = {
  async list(catalog: CatalogName) {
    if (sessionService.getSnapshot().status !== 'authenticated') throw new Error('Connexion requise.')
    if (!repository) throw new Error('Référentiels non configurés.')
    try { return await repository.list(catalog) } catch { console.error('[references] Read failed'); throw new Error('Référentiel indisponible. Vérifiez la migration PocketBase et réessayez.') }
  },
  async save(catalog: CatalogName, input: ReferenceInput, id?: string) {
    const session = sessionService.getSnapshot()
    if (session.status !== 'authenticated' || !hasPermission(session.user, 'settings.references')) throw new Error('Administration des référentiels non autorisée.')
    if (!repository) throw new Error('Référentiels non configurés.')
    const parsed = referenceInputSchema.parse(input)
    try { return await repository.save(catalog, parsed, id) } catch { console.error('[references] Save failed'); throw new Error('Enregistrement refusé. Vérifiez le code, les doublons et les permissions.') }
  },
}
