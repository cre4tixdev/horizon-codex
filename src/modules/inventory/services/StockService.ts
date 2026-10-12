import { ClientResponseError } from 'pocketbase'
import { summarizeStock } from './stockBalance'
import { environment } from '../../../core/config/environment'
import { sessionService } from '../../../core/auth/services/session'
import { hasPermission } from '../../../core/auth/types/session'
import { createStockRepository } from '../repositories/StockRepository'
import type { StockSelection, StockQuery, StockAdjustment } from '../schemas/stock'
const repository = environment.pocketBaseUrl ? createStockRepository(environment.pocketBaseUrl) : undefined
async function run<T>(action: string, operation: (repo: ReturnType<typeof createStockRepository>) => Promise<T>) {
  const session = sessionService.getSnapshot()
  if (!repository || session.status !== 'authenticated' || !hasPermission(session.user, 'inventory.read') || action !== 'read' && !hasPermission(session.user, action === 'settings' ? 'settings.references' : `inventory.stock.${action}`)) throw new Error('Accès au stock refusé.')
  try { return await operation(repository) } catch (error) { console.error('[stock] Operation failed', { status: error instanceof ClientResponseError ? error.status : 0 }); throw new Error(error instanceof ClientResponseError && [400, 403, 404, 409].includes(error.status) ? error.response.message : 'Stock indisponible. Réessayez.', { cause: error }) }
}
export const stockService = {
  productReservations: (id: string) => run('read', (repo) => repo.productReservations(id)),
  // Stock pages paginate products, so a single product includes all its active locations.
  productBalance: (product: string) => run('read', async (repo) => summarizeStock((await repo.list({ q: '', product, location: '', sort: '', group: '', page: 1 })).items)),
  list: (query: StockQuery) => run('read', (repo) => repo.list(query)), choices: () => run('read', (repo) => repo.choices()),
  adjust: (body: StockAdjustment) => run('adjust', (repo) => repo.adjust(body)), reservations: (id: string) => run('read', (repo) => repo.reservations(id)),
  reserve: (quote: string, revision: string, selections: StockSelection[]) => run('reserve', (repo) => repo.reserve(quote, revision, selections)),
  createLocation: (warehouse: string, code: string, name: string) => run('settings', (repo) => repo.createLocation(warehouse, code, name)),
}
