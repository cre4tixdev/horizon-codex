import { ClientResponseError } from 'pocketbase'
import { sessionService } from '../auth/services/session'
import { environment } from '../config/environment'
import { createViewsRepository } from './ViewsRepository'
import { savedViewInputSchema, type SavedViewInput, type ViewContext } from './types'

export class ViewsService {
  constructor(private readonly repository: ReturnType<typeof createViewsRepository> | undefined, private readonly allowed: () => boolean) {}
  private async run<T>(action: (repo: ReturnType<typeof createViewsRepository>) => Promise<T>) {
    if (!this.allowed()) throw new Error('Vous ne disposez pas des permissions nécessaires.')
    if (!this.repository) throw new Error('Les vues enregistrées ne sont pas configurées.')
    try { return await action(this.repository) }
    catch (error) {
      console.error('[views] Request failed', { status: error instanceof ClientResponseError ? error.status : 0 })
      if (error instanceof ClientResponseError && error.status === 404) throw new Error('Vues indisponibles : installez le lot Vues et regroupements sur PocketBase.', { cause: error })
      if (error instanceof ClientResponseError && error.status === 403) throw new Error('Cette vue ne peut pas être modifiée avec vos droits.', { cause: error })
      throw new Error('Impossible de traiter cette vue. Vérifiez les critères ou réessayez.', { cause: error })
    }
  }
  list(context: ViewContext) { return this.run((repo) => repo.list(context)) }
  save(input: SavedViewInput, id?: string) { const parsed = savedViewInputSchema.parse(input); return this.run((repo) => repo.save(parsed, id)) }
  remove(id: string) { return this.run((repo) => repo.remove(id)) }
}
export const viewsService = new ViewsService(environment.pocketBaseUrl ? createViewsRepository(environment.pocketBaseUrl) : undefined, () => {
  const session = sessionService.getSnapshot()
  return session.status === 'authenticated' && session.user.role.permissions.includes('contacts.read')
})
