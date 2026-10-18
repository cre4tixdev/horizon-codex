import { ClientResponseError } from 'pocketbase'
import { environment } from '../../../core/config/environment'
import { sessionService } from '../../../core/auth/services/session'
import { hasPermission } from '../../../core/auth/types/session'
import { createHrRepository, HrConfigurationError } from '../repositories/HrRepository'
import { employeeInputSchema, type Employee, type EmployeeInput, type Team } from '../schemas/employees'
const repository = environment.pocketBaseUrl ? createHrRepository(environment.pocketBaseUrl) : undefined
function authorize(permission: string) {
  const session = sessionService.getSnapshot()
  if (session.status !== 'authenticated' || !hasPermission(session.user, permission)) throw new Error('Accès aux employés non autorisé.')
  if (!repository) throw new Error('Module Employés non configuré.')
  return repository
}
function failure(error: unknown): never {
  const status = error instanceof ClientResponseError ? error.status : 0
  console.error('[hr] Operation failed', { status })
  if (error instanceof HrConfigurationError) throw error
  if (error instanceof ClientResponseError && error.status === 503 && typeof error.response.message === 'string' && error.response.message.includes('1791840032')) throw new HrConfigurationError('Le paramétrage des temps n’est pas installé sur PocketBase. Copiez la migration 1791840032 et les hooks à jour, puis redémarrez PocketBase.')
  throw new Error(status === 409 ? 'La fiche a changé. Fermez l’éditeur et actualisez la liste.' : status === 400 ? 'Fiche refusée : vérifiez les dates, les responsables, les managers d’équipes et les collaborateurs encore affectés.' : status === 403 ? 'Action hors de votre périmètre ou non autorisée.' : 'Module Employés indisponible. Vérifiez l’installation et réessayez.', { cause: error })
}
export const hrService = {
  async directory() { const source = authorize('hr.read'); try { return await source.directory() } catch (error) { return failure(error) } },
  async save(input: EmployeeInput, record?: Employee, avatar?: File, removeAvatar = false) { const source = authorize('hr.write'); const parsed = employeeInputSchema.parse(input); if (avatar && (!['image/png', 'image/jpeg', 'image/webp'].includes(avatar.type) || avatar.size > 2097152)) throw new Error('Photo PNG, JPEG ou WebP de 2 Mio maximum.'); try { return await source.save(parsed, record, avatar, removeAvatar) } catch (error) { return failure(error) } },
  async imageURL(record: Employee) { const source = authorize('hr.read'); try { return await source.imageURL(record) } catch (error) { return failure(error) } },
  async team(name: string, managers: string[], active = true, record?: Team, timeWorkType: Team['time_work_type'] = record?.time_work_type || 'none') { const source = authorize('settings.references'); try { return await source.team(name.trim(), managers, active, record, timeWorkType) } catch (error) { return failure(error) } },
}
