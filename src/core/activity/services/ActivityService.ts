import { ZodError } from 'zod'
import { ClientResponseError } from 'pocketbase'
import { environment } from '../../config/environment'
import { sessionService } from '../../auth/services/session'
import { createActivityRepository } from '../repositories/ActivityRepository'
import { activitySourceSchema, publicationSchema, taskStatusSchema, type ActivityFilter, type ActivitySource, type Publication } from '../types/activity'
export class ActivityService {
  constructor(private readonly repository: ReturnType<typeof createActivityRepository> | undefined, private readonly allowed: (write: boolean, source?: ActivitySource) => boolean) {}
  private async run<T>(write: boolean, operation: (repo: ReturnType<typeof createActivityRepository>) => Promise<T>, source?: ActivitySource) {
    if (!this.allowed(write, source)) throw new Error('Vous ne disposez pas des permissions nécessaires.')
    if (!this.repository) throw new Error('Le fil d’activité n’est pas configuré.')
    try { return await operation(this.repository) }
    catch (error) {
      console.error('[activity] Operation failed', {
        status: error instanceof ClientResponseError ? error.status : undefined,
        ...(error instanceof ClientResponseError ? { aborted: error.isAbort } : {}),
        ...(error instanceof ZodError ? { validation: error.issues.slice(0, 5).map((issue) => ({ code: issue.code, path: issue.path.join('.') })) } : {}),
      })
      if (error instanceof ZodError) throw new Error('Le fil d’activité contient des données illisibles. Réessayez.', { cause: error })
      if (error instanceof ClientResponseError && error.status === 403) throw new Error('Vous n’avez pas accès au fil d’activité de cette fiche.', { cause: error })
      if (error instanceof ClientResponseError && error.status === 404) throw new Error('Fil indisponible : vérifiez la fiche et l’installation du lot Activité sur PocketBase.', { cause: error })
      if (error instanceof ClientResponseError && error.status === 409) throw new Error(error.response.message || 'Cette pièce doit être conservée.', { cause: error })
      if (error instanceof ClientResponseError && error.status === 400) throw new Error(write ? 'Publication refusée. Vérifiez le message, les fichiers, les destinataires et l’état de la fiche.' : 'Chargement du fil refusé. Vérifiez la fiche et les mises à jour PocketBase.', { cause: error })
      throw new Error('Le fil d’activité est indisponible. Réessayez.', { cause: error })
    }
  }
  avatar(id: string, source: ActivitySource) { const parsed = activitySourceSchema.parse(source); if (!/^[a-z0-9]{15}$/.test(id)) throw new Error('Publication invalide.'); return this.run(false, (repo) => repo.avatar(id), parsed) }
  list(source: ActivitySource, page: number, filter: ActivityFilter) { const parsed = activitySourceSchema.parse(source); return this.run(false, (repo) => repo.list(parsed, page, filter), parsed) }
  users(query: string, source?: ActivitySource) { return this.run(true, (repo) => repo.users(query.slice(0, 80), source), source) }
  tasks(source: ActivitySource) { return this.run(false, (repo) => repo.tasks(activitySourceSchema.parse(source)), source) }
  publish(source: ActivitySource, input: Publication, files: File[]) {
    const parsed = publicationSchema.parse(input)
    if (!parsed.body && !files.length) throw new Error('Ajoutez un message ou une pièce jointe.')
    if (parsed.type === 'task' && !parsed.task) throw new Error('Renseignez les informations de la tâche.')
    if (files.length > 5 || files.some((file) => file.size > 10485760 || !['application/pdf', 'image/png', 'image/jpeg', 'image/webp', 'text/plain'].includes(file.type))) throw new Error('Maximum 5 fichiers PDF, PNG, JPEG, WebP ou texte, de 10 Mio chacun.')
    return this.run(true, (repo) => repo.publish(activitySourceSchema.parse(source), parsed, files), source)
  }
  updateTask(id: string, change: Parameters<ReturnType<typeof createActivityRepository>['updateTask']>[1]) { if (change.status) taskStatusSchema.parse(change.status); return this.run(true, (repo) => repo.updateTask(id, change)) }
  attachmentURL(collectionId: string, id: string, filename: string) { return this.run(false, (repo) => repo.attachmentURL(collectionId, id, filename)) }
  removeAttachment(id: string, filename: string) { return this.run(true, (repo) => repo.removeAttachment(id, filename)) }
}
export const activityService = new ActivityService(environment.pocketBaseUrl ? createActivityRepository(environment.pocketBaseUrl) : undefined, (write, source) => {
  const session = sessionService.getSnapshot()
  const modules = source ? [source.entity === 'leave_requests' ? 'leave' : source.entity === 'expenses_reports' ? 'expenses' : source.entity.startsWith('billing_') ? 'billing' : source.entity.startsWith('purchasing_') ? 'purchasing' : source.entity.startsWith('inventory_') ? 'inventory' : source.entity.startsWith('sales_') ? 'sales' : source.entity.startsWith('crm_') ? 'crm' : 'contacts'] : ['contacts', 'crm', 'sales', 'inventory', 'purchasing', 'billing', 'expenses', 'leave']
  return session.status === 'authenticated' && modules.some((module) => session.user.role.permissions.includes(`${module}.read`) && (!write || session.user.role.permissions.includes(`${module}.write`) || module === 'leave' && (session.user.role.permissions.includes('leave.validate') || session.user.role.permissions.includes('leave.allocate')) || module === 'expenses' && session.user.role.permissions.includes('expenses.validate')))
})
