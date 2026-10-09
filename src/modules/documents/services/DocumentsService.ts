import { ClientResponseError } from 'pocketbase'
import { environment } from '../../../core/config/environment'
import { sessionService } from '../../../core/auth/services/session'
import { hasPermission } from '../../../core/auth/types/session'
import { createDocumentsRepository, type PreviewInput } from '../repositories/DocumentsRepository'
import { layoutSchema, type Layout } from '../schemas/templates'
import type { FileSettings } from '../schemas/fileSettings'
const repository = environment.pocketBaseUrl ? createDocumentsRepository(environment.pocketBaseUrl) : undefined
async function run<T>(manage: boolean, action: (repo: NonNullable<typeof repository>) => Promise<T>): Promise<T> {
  const session = sessionService.getSnapshot()
  if (session.status !== 'authenticated' || !(hasPermission(session.user, 'documents.template.manage') || !manage && hasPermission(session.user, 'sales.read'))) throw new Error('Accès aux modèles de documents refusé.')
  if (!repository) throw new Error('Documents n’est pas configuré.')
  try { return await action(repository) } catch (error) {
    console.error('[documents] Operation failed', { status: error instanceof ClientResponseError ? error.status : 0 })
    throw new Error(error instanceof ClientResponseError && [400, 403, 404, 409, 502, 503].includes(error.status) ? error.response.message : 'Le service Documents est indisponible. Réessayez.', { cause: error })
  }
}
export const documentsService = {
  fileSettings: () => run(true, (repo) => repo.fileSettings()), saveFileSettings: (input: FileSettings) => run(true, (repo) => repo.saveFileSettings(input)),
  list: () => run(false, (repo) => repo.list()), record: (id: string) => run(true, (repo) => repo.record(id)),
  save: (name: string, layout: Layout, id?: string, updated?: string) => run(true, (repo) => repo.save(name, layoutSchema.parse(layout), id, updated)),
  delete: (id: string, updated: string) => run(true, (repo) => repo.delete(id, updated)),
  publish: (id: string, updated: string) => run(true, (repo) => repo.publish(id, updated)), archive: (id: string, updated: string) => run(true, (repo) => repo.archive(id, updated)),
  preview: (input: PreviewInput) => run(Boolean(input.content_json), (repo) => repo.preview(input)), pdf: (input: PreviewInput) => run(Boolean(input.content_json), (repo) => repo.pdf(input)),
}
