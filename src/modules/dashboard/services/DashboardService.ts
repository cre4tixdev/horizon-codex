import { ClientResponseError } from 'pocketbase'
import { environment } from '../../../core/config/environment'
import { createDashboardRepository } from '../repositories/DashboardRepository'
export class DashboardService {
  constructor(private readonly repository: ReturnType<typeof createDashboardRepository> | undefined) {}
  private async run<T>(operation: (repo: ReturnType<typeof createDashboardRepository>) => Promise<T>) {
    if (!this.repository) throw new Error('Le dashboard n’est pas configuré.')
    try { return await operation(this.repository) } catch (error) {
      const status = error instanceof ClientResponseError ? error.status : 0
      console.error('[dashboard] Data unavailable', { status })
      throw new Error(status === 404 ? 'Mettez à jour les hooks PocketBase du dashboard.' : status === 403 ? 'Vous ne disposez pas des droits de consultation nécessaires.' : 'Les données du dashboard sont indisponibles. Réessayez.', { cause: error })
    }
  }
  metrics(from: string, to: string) { return this.run((repo) => repo.metrics(from, to)) }
  tasks(from: string, to: string) { return this.run((repo) => repo.tasks(from, to)) }
  activity() { return this.run((repo) => repo.activity()) }
}
export const dashboardService = new DashboardService(environment.pocketBaseUrl ? createDashboardRepository(environment.pocketBaseUrl) : undefined)
