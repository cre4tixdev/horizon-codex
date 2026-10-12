import { ClientResponseError } from 'pocketbase'
import { environment } from '../../../core/config/environment'
import { sessionService } from '../../../core/auth/services/session'
import { hasPermission } from '../../../core/auth/types/session'
import { createTraceRepository } from '../repositories/TraceRepository'
const repository = environment.pocketBaseUrl ? createTraceRepository(environment.pocketBaseUrl) : undefined
async function run<T>(right: string, fn: (repo: ReturnType<typeof createTraceRepository>) => Promise<T>) {
  const session = sessionService.getSnapshot()
  if (!repository || session.status !== 'authenticated' || !hasPermission(session.user, right)) throw new Error('Accès à la traçabilité refusé.')
  try { return await fn(repository) } catch (error) { console.error('[stock-traces] Operation failed', { status: error instanceof ClientResponseError ? error.status : 0 }); throw new Error(error instanceof ClientResponseError && [400, 403, 404, 409].includes(error.status) ? error.response.message : 'Traçabilité indisponible. Réessayez.', { cause: error }) }
}
export const traceService = {
  choices: (product: string, location?: string) => run('inventory.read', (repo) => repo.choices(product, location)),
  history: (product: string, lot: string, serial: string, page: number) => run('inventory.read', (repo) => repo.history(product, lot, serial, page)),
  lot: (id: string, updated: string, status: string, expiry: string) => run('inventory.write', (repo) => repo.lot(id, updated, status, expiry)),
}
