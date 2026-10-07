import { ClientResponseError } from 'pocketbase'
import { environment } from '../../config/environment'
import { sessionService } from './session'
import { accessInputSchema, type AccessInput, type AccessUser } from '../schemas/access'
import { createAccessRepository } from '../repositories/AccessRepository'
const repository = environment.pocketBaseUrl ? createAccessRepository(environment.pocketBaseUrl) : undefined
function authorize() {
  const session = sessionService.getSnapshot()
  if (session.status !== 'authenticated' || session.user.erpProfile !== 'admin') throw new Error('Gestion des accès réservée à un Admin.')
  if (!repository) throw new Error('Gestion des accès non configurée.')
  return repository
}
function failure(error: unknown): never {
  console.error('[access] Operation failed', { status: error instanceof ClientResponseError ? error.status : 0 })
  throw new Error(error instanceof ClientResponseError && error.status === 409 ? 'Le compte a changé. Fermez l’éditeur et actualisez la liste.' : error instanceof ClientResponseError && error.status === 400 ? 'Enregistrement refusé : vérifiez le compte, le rattachement et la présence d’un Admin actif.' : 'Gestion des accès indisponible. Vérifiez l’installation et vos droits.', { cause: error })
}
export const accessService = {
  async list() { const source = authorize(); try { return await source.list() } catch (error) { return failure(error) } },
  async save(input: AccessInput, record?: AccessUser) { const source = authorize(); const parsed = accessInputSchema.parse(input); if (!record && !input.password) throw new Error('Mot de passe initial requis.'); try { return await source.save(parsed, record) } catch (error) { return failure(error) } },
}
