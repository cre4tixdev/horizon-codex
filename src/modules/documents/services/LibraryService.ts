import { ClientResponseError } from 'pocketbase'
import { environment } from '../../../core/config/environment'
import { sessionService } from '../../../core/auth/services/session'
import { createLibraryRepository } from '../repositories/LibraryRepository'
import { gedExtensions, libraryInputSchema } from '../schemas/library'
const repository = environment.pocketBaseUrl ? createLibraryRepository(environment.pocketBaseUrl) : undefined
export class LibraryService {
  constructor(private readonly repository: ReturnType<typeof createLibraryRepository> | undefined, private readonly allowed: (action: string) => boolean) {}
  private async run<T>(action: string, operation: (repo: ReturnType<typeof createLibraryRepository>) => Promise<T>) {
    if (!this.allowed(action)) throw new Error('Vous ne disposez pas de l’accès nécessaire à la GED.')
    if (!this.repository) throw new Error('La GED n’est pas configurée.')
    try { return await operation(this.repository) } catch (error) {
      if (error instanceof ClientResponseError && error.isAbort) throw error
      console.error('[documents-library] Operation failed', { status: error instanceof ClientResponseError ? error.status : 0 })
      throw new Error(error instanceof ClientResponseError && [400, 403, 404, 409].includes(error.status) ? error.response.message || 'Ce document est inaccessible ou a changé. Actualisez la page.' : 'La GED est indisponible. Vérifiez l’installation du lot Documents puis réessayez.', { cause: error })
    }
  }
  private files(files: File[], single = false) { if (!files.length || files.length > (single ? 1 : 10) || files.some((f) => f.size > 10485760 || !gedExtensions.includes(f.name.split('.').pop()?.toLowerCase() || '')) || files.reduce((s, f) => s + f.size, 0) > 25165824) throw new Error('Choisissez 1 à 10 fichiers autorisés de 10 Mo maximum, 24 Mo au total.') }
  list(query: Record<string, string>, signal?: AbortSignal) { return this.run('read', (r) => r.list(query, signal)) }
  context(entity: string, id: string) { return this.run('read', (r) => r.context(entity, id)) }
  record(id: string) { return this.run('read', (r) => r.record(id)) }
  choices() { return this.run('read', (r) => r.choices()) }
  search(kind: string, q: string, signal?: AbortSignal) { return this.run('read', (r) => r.search(kind, q.slice(0, 100), signal)) }
  upload(input: Parameters<ReturnType<typeof createLibraryRepository>['upload']>[0], files: File[]) { this.files(files); return this.run('write', (r) => r.upload(libraryInputSchema.parse(input), files)) }
  save(id: string, updated: string, input: Parameters<ReturnType<typeof createLibraryRepository>['save']>[2]) { return this.run('write', (r) => r.save(id, updated, libraryInputSchema.parse(input))) }
  version(id: string, updated: string, note: string, file: File) { this.files([file], true); if (!note.trim() || note.length > 1000) throw new Error('Indiquez ce qui a changé dans cette version.'); return this.run('write', (r) => r.version(id, updated, note.trim(), file)) }
  archive(id: string, updated: string, archived: boolean) { return this.run('write', (r) => r.archive(id, updated, archived)) }
  folder(input: Parameters<ReturnType<typeof createLibraryRepository>['folder']>[0]) { return this.run('write', (r) => r.folder(input)) }
  category(input: Parameters<ReturnType<typeof createLibraryRepository>['category']>[0]) { return this.run('settings', (r) => r.category(input)) }
  file(id: string, version: string) { return this.run('read', (r) => r.file(id, version)) }
}
export const libraryService = new LibraryService(repository, (action) => {
  const session = sessionService.getSnapshot()
  return session.status === 'authenticated' && session.user.role.permissions.includes('documents.read') && (action === 'read' || session.user.erpProfile !== 'viewer' && session.user.role.permissions.includes(`documents.${action}`))
})
