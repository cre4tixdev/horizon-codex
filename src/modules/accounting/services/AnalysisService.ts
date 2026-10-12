import { ClientResponseError } from 'pocketbase'
import { environment } from '../../../core/config/environment'
import { sessionService } from '../../../core/auth/services/session'
import { hasPermission } from '../../../core/auth/types/session'
import { createAnalysisRepository } from '../repositories/AnalysisRepository'
const repository = environment.pocketBaseUrl ? createAnalysisRepository(environment.pocketBaseUrl) : undefined
async function run<T>(operation: (repo: ReturnType<typeof createAnalysisRepository>) => Promise<T>) {
    const session = sessionService.getSnapshot()
    if (!repository || session.status !== 'authenticated' || session.user.erpProfile !== 'admin' && !hasPermission(session.user, 'analysis.read')) throw new Error('Accès à l’analyse refusé.')
    try { return await operation(repository) } catch (error) {
      console.error('[analysis] Report unavailable', { status: error instanceof ClientResponseError ? error.status : 0 })
      throw new Error(error instanceof ClientResponseError && [400, 403, 404].includes(error.status) ? error.response.message : 'Analyse indisponible. Réessayez.', { cause: error })
    }
}
export const analysisService = {
  read: (source: { opportunity: string } | { quote: string }) => run((repo) => repo.read(source)),
  list: (query: Record<string, string>) => run((repo) => repo.list(query)),
}
