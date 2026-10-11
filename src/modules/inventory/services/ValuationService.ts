import { ClientResponseError } from 'pocketbase'
import { environment } from '../../../core/config/environment'
import { sessionService } from '../../../core/auth/services/session'
import { hasPermission } from '../../../core/auth/types/session'
import { createValuationRepository } from '../repositories/ValuationRepository'
import type { ValuationCostInput, ValuationMethodInput } from '../schemas/valuation'
const repository = environment.pocketBaseUrl ? createValuationRepository(environment.pocketBaseUrl) : undefined
async function run<T>(right: string, fn: (repo: ReturnType<typeof createValuationRepository>) => Promise<T>) {
  const session = sessionService.getSnapshot()
  if (!repository || session.status !== 'authenticated' || !hasPermission(session.user, right)) throw new Error('Accès à la valorisation refusé.')
  try { return await fn(repository) } catch (error) { console.error('[stock-valuation] Operation failed', { status: error instanceof ClientResponseError ? error.status : 0 }); throw new Error(error instanceof ClientResponseError && [400, 403, 404, 409].includes(error.status) ? error.response.message : 'Valorisation indisponible. Réessayez.', { cause: error }) }
}
export const valuationService = {
  list: (query: { q?: string; product?: string; page?: number } = {}) => run('inventory.read', (repo) => repo.list(query)),
  history: (product: string) => run('inventory.read', (repo) => repo.history(product)),
  cost: (input: ValuationCostInput) => run('settings.references', (repo) => repo.cost(input)),
  method: (input: ValuationMethodInput) => run('settings.references', (repo) => repo.method(input)),
}
