import { ClientResponseError } from 'pocketbase'
import { environment } from '../../config/environment'
import { sessionService } from '../../auth/services/session'
import { createActivityRepository } from '../repositories/ActivityRepository'
import { activitySourceSchema, publicationSchema, taskStatusSchema, type ActivityFilter, type ActivitySource, type Publication } from '../types/activity'
export class ActivityService {
  constructor(private readonly repository: ReturnType<typeof createActivityRepository> | undefined, private readonly allowed: (write: boolean) => boolean) {}
  private async run<T>(write: boolean, operation: (repo: ReturnType<typeof createActivityRepository>) => Promise<T>) {
    if (!this.allowed(write)) throw new Error('Vous ne disposez pas des permissions nécessaires.')
    if (!this.repository) throw new Error('Le fil d’activité n’est pas configuré.')
    try { return await operation(this.repository) }
    catch (error) {
      console.error('[activity] Operation failed', { status: error instanceof ClientResponseError ? error.status : 0 })
      if (error instanceof ClientResponseError && error.status === 404) throw new Error('Fil indisponible : vérifiez la fiche et l’installation du lot Activité sur PocketBase.', { cause: error })
      if (error instanceof ClientResponseError && error.status === 400) throw new Error('Publication refusée. Vérifiez le message, les fichiers, les destinataires et l’état de la fiche.', { cause: error })
      throw new Error('Le fil d’activité est indisponible. Réessayez.', { cause: error })
    }
  }
  list(source: ActivitySource, page: number, filter: ActivityFilter) { const parsed = activitySourceSchema.parse(source); return this.run(false, (repo) => repo.list(parsed, page, filter)) }
  users(query: string) { return this.run(true, (repo) => repo.users(query.slice(0, 80))) }
  tasks(source: ActivitySource) { return this.run(false, (repo) => repo.tasks(activitySourceSchema.parse(source))) }
  publish(source: ActivitySource, input: Publication, files: File[]) {
    const parsed = publicationSchema.parse(input)
    if (!parsed.body && !files.length) throw new Error('Ajoutez un message ou une pièce jointe.')
    if (parsed.type === 'task' && !parsed.task) throw new Error('Renseignez les informations de la tâche.')
    if (files.length > 5 || files.some((file) => file.size > 10485760 || !['application/pdf', 'image/png', 'image/jpeg', 'image/webp', 'text/plain'].includes(file.type))) throw new Error('Maximum 5 fichiers PDF, PNG, JPEG, WebP ou texte, de 10 Mio chacun.')
    return this.run(true, (repo) => repo.publish(activitySourceSchema.parse(source), parsed, files))
  }
  updateTask(id: string, change: Parameters<ReturnType<typeof createActivityRepository>['updateTask']>[1]) { if (change.status) taskStatusSchema.parse(change.status); return this.run(true, (repo) => repo.updateTask(id, change)) }
  attachmentURL(collectionId: string, id: string, filename: string) { return this.run(false, (repo) => repo.attachmentURL(collectionId, id, filename)) }
}
export const activityService = new ActivityService(environment.pocketBaseUrl ? createActivityRepository(environment.pocketBaseUrl) : undefined, (write) => {
  const session = sessionService.getSnapshot()
  return session.status === 'authenticated' && session.user.role.permissions.includes('contacts.read') && (!write || session.user.role.permissions.includes('contacts.write'))
})
