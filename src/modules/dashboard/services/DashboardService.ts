import { ClientResponseError } from 'pocketbase'
import type { DashboardPreference } from '../schemas/layouts'
import { ZodError } from 'zod'
import { environment } from '../../../core/config/environment'
import { createDashboardRepository } from '../repositories/DashboardRepository'
export class DashboardService {
  constructor(private readonly repository: ReturnType<typeof createDashboardRepository> | undefined) {}
  private async run<T>(operation: (repo: ReturnType<typeof createDashboardRepository>) => Promise<T>) {
    if (!this.repository) throw new Error('Le dashboard n’est pas configuré.')
    try { return await operation(this.repository) } catch (error) {
      if (error instanceof ClientResponseError && error.isAbort) throw error
      const status = error instanceof ClientResponseError ? error.status : 0
      console.error('[dashboard] Data unavailable', { status, reason: error instanceof ZodError ? 'invalid-response' : 'request-failed' })
      throw new Error(error instanceof ZodError ? 'Le format des données du dashboard est incompatible. Mettez Horizon à jour.' : status === 409 ? 'Vos dashboards ont été modifiés ailleurs. Rechargez les dispositions avant de réessayer ; vos modifications restent affichées.' : status === 400 ? 'Vérifiez le nom et les dimensions de vos widgets.' : status === 404 ? 'Mettez à jour les hooks PocketBase du dashboard.' : status === 403 ? 'Vous ne disposez pas des droits de consultation nécessaires.' : 'Les données du dashboard sont indisponibles. Réessayez.', { cause: error })
    }
  }
  metrics(from: string, to: string) { return this.run((repo) => repo.metrics(from, to)) }
  tasks(from: string, to: string) { return this.run((repo) => repo.tasks(from, to)) }
  layouts() { return this.run((repo) => repo.layouts()) }
  saveLayouts(revision: number, preference: DashboardPreference) { return this.run((repo) => repo.saveLayouts(revision, preference)) }
  activity() { return this.run((repo) => repo.activity()) }
}
export const dashboardService = new DashboardService(environment.pocketBaseUrl ? createDashboardRepository(environment.pocketBaseUrl) : undefined)
