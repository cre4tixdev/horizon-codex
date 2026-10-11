import { ClientResponseError } from 'pocketbase'
import { environment } from '../../../core/config/environment'
import { sessionService } from '../../../core/auth/services/session'
import { hasPermission } from '../../../core/auth/types/session'
import { createOperationsRepository } from '../repositories/OperationsRepository'
import type { OperationSourceQuery, OperationsQuery, OperationInput, StockSettings } from '../schemas/operations'
const repository = environment.pocketBaseUrl ? createOperationsRepository(environment.pocketBaseUrl) : undefined
async function run<T>(right: string, fn: (repo: ReturnType<typeof createOperationsRepository>) => Promise<T>) {
  const session = sessionService.getSnapshot()
  if (!repository || session.status !== 'authenticated' || !hasPermission(session.user, right)) throw new Error('Accès au stock refusé.')
  try { return await fn(repository) } catch (error) { console.error('[stock-operations] Operation failed', { status: error instanceof ClientResponseError ? error.status : 0 }); throw new Error(error instanceof ClientResponseError && [400, 403, 404, 409].includes(error.status) ? error.response.message : 'Opérations de stock indisponibles. Réessayez.', { cause: error }) }
}
export const operationsService = {
  list: (query: OperationsQuery) => run('inventory.read', (repo) => repo.list(query)),
  record: (id: string) => run('inventory.read', (repo) => repo.record(id)), choices: () => run('inventory.read', (repo) => repo.choices()),
  source: (query: OperationSourceQuery) => run('inventory.read', (repo) => repo.source(query)),
  product: (id: string) => run('inventory.read', (repo) => repo.product(id)),
  save: (input: OperationInput, key: string, id?: string, updated?: string) => run('inventory.write', (repo) => repo.save(input, key, id, updated)),
  transition: (id: string, updated: string, action: string) => run('inventory.stock.validate', (repo) => repo.transition(id, updated, action)),
  settings: () => run('settings.references', (repo) => repo.settings()), saveSettings: (input: StockSettings) => run('settings.references', (repo) => repo.saveSettings(input)),
}
