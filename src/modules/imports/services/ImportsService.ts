import { importErrorMessage } from './errors'
import { ClientResponseError } from 'pocketbase'
import { environment } from '../../../core/config/environment'
import { createImportsRepository } from '../repositories/ImportsRepository'
import { sessionService } from '../../../core/auth/services/session'
import type { PreviewInput } from '../schemas/imports'
import { hasPermission } from '../../../core/auth/types/session'
const repository = environment.pocketBaseUrl ? createImportsRepository(environment.pocketBaseUrl) : undefined
async function run<T>(action: (repo: NonNullable<typeof repository>) => Promise<T>): Promise<T> {
  const session = sessionService.getSnapshot()
  if (session.status !== 'authenticated' || session.user.erpProfile === 'viewer' || !['contacts.read', 'contacts.write', 'contacts.import'].every((right) => hasPermission(session.user, right))) throw new Error('Vous ne disposez pas du droit Importer les contacts.')
  if (!repository) throw new Error('PocketBase n’est pas configuré.')
  try { return await action(repository) }
  catch (error) {
    console.error('[imports] Operation failed', { status: error instanceof ClientResponseError ? error.status : 0 })
    throw new Error(importErrorMessage(error), { cause: error })
  }
}

type Repository = NonNullable<typeof repository>
export const importsService = {
  preview: (input: PreviewInput) => run((repo) => repo.preview(input)),
  get: (id: string) => run((repo) => repo.get(id)),
  resolve: (id: string, row: string, resolution: string, values?: Record<string, string>) => run((repo) => repo.resolve(id, row, resolution, values)),
  resolveBulk: (id: string, filter: string, resolution: '' | 'skip') => run((repo) => repo.resolveBulk(id, filter, resolution)),
  recheck: (id: string) => run((repo) => repo.recheck(id)),
  discard: (id: string) => run((repo) => repo.discard(id)),
  apply: (id: string) => run((repo) => repo.apply(id)),
  history: () => run((repo) => repo.history()),
  profiles: () => run((repo) => repo.profiles()),
  saveProfile: (input: Parameters<Repository['saveProfile']>[0]) => run((repo) => repo.saveProfile(input)),
  odoo: () => run((repo) => repo.odoo()),
  saveOdoo: (input: Parameters<Repository['saveOdoo']>[0]) => run((repo) => repo.saveOdoo(input)),
  readOdoo: (input: Parameters<Repository['readOdoo']>[0]) => run((repo) => repo.readOdoo(input)),
}
