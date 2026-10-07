import { hasPermission } from '../../../core/auth/types/session'
import { environment } from '../../../core/config/environment'
import { sessionService } from '../../../core/auth/services/session'
import { createCrmSettingsRepository } from '../repositories/CrmSettingsRepository'
import { crmSettingsSchema, type CrmSettings } from '../schemas/crmSettings'
const repository = environment.pocketBaseUrl ? createCrmSettingsRepository(environment.pocketBaseUrl) : undefined
export const crmSettingsService = {
  async read() {
    const session = sessionService.getSnapshot()
    if (session.status !== 'authenticated' || !(hasPermission(session.user, 'crm.read') || hasPermission(session.user, 'settings.references'))) throw new Error('Accès aux paramètres CRM refusé.')
    if (!repository) throw new Error('Paramètres CRM non configurés.')
    try { return await repository.read() } catch (error) { console.error('[settings] CRM configuration unavailable'); throw new Error('Paramètres CRM indisponibles. Vérifiez la migration et réessayez.', { cause: error }) }
  },
  async save(id: string, view: CrmSettings['default_view']) {
    const session = sessionService.getSnapshot()
    if (session.status !== 'authenticated' || !hasPermission(session.user, 'settings.references')) throw new Error('Modification des paramètres CRM non autorisée.')
    if (!repository) throw new Error('Paramètres CRM non configurés.')
    const parsed = crmSettingsSchema.shape.default_view.parse(view)
    try { return await repository.save(id, parsed) } catch (error) { console.error('[settings] CRM configuration save failed'); throw new Error('Paramètres CRM non enregistrés. Réessayez.', { cause: error }) }
  },
}
