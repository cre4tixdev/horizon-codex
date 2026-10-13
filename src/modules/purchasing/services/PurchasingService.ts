import { ClientResponseError } from 'pocketbase'
import { ZodError } from 'zod'
import { environment } from '../../../core/config/environment'
import { sessionService } from '../../../core/auth/services/session'
import { hasPermission } from '../../../core/auth/types/session'
import { createPurchasingRepository } from '../repositories/PurchasingRepository'
import { purchaseInputSchema, type PurchaseKind, type PurchaseInput, type PurchaseListOptions, type PurchaseSettings, type OrderSelection } from '../schemas/purchasing'
const repository = environment.pocketBaseUrl ? createPurchasingRepository(environment.pocketBaseUrl) : undefined
async function run<T>(action: string, operation: (repo: ReturnType<typeof createPurchasingRepository>) => Promise<T>) {
  const session = sessionService.getSnapshot()
  if (!repository || session.status !== 'authenticated' || !hasPermission(session.user, 'purchasing.read') || action !== 'read' && !hasPermission(session.user, `purchasing.${action}`)) throw new Error('Accès aux achats refusé.')
  try { return await operation(repository) } catch (error) { console.error('[purchasing] Operation failed', { status: error instanceof ClientResponseError ? error.status : 0, ...(error instanceof ZodError ? { validation: error.issues.map(({ path, code }) => ({ path, code })) } : {}) }); throw new Error(error instanceof ClientResponseError && [400, 403, 404, 409].includes(error.status) ? error.response.message : 'Achats indisponibles. Réessayez.', { cause: error }) }
}
export const purchasingService = {
  overview: (query: PurchaseListOptions) => run('read', (repo) => repo.overview(query)),
  list: (kind: PurchaseKind, query: PurchaseListOptions) => run('read', (repo) => repo.list(kind, query)),
  record: (kind: PurchaseKind, id: string) => run('read', (repo) => repo.record(kind, id)),
  choices: () => run('read', (repo) => repo.choices()),
  needs: (id: string, preview = false) => run('read', (repo) => repo.needs(id, preview)),
  product: (id: string, currency: string, supplier?: string) => run('read', (repo) => repo.product(id, currency, supplier)),
  save: (kind: PurchaseKind, input: PurchaseInput, key: string, id?: string, updated?: string) => run('write', (repo) => repo.save(kind, purchaseInputSchema.parse(input), key, id, updated)),
  transition: (kind: PurchaseKind, id: string, updated: string, action: 'validate' | 'reopen' | 'cancel' | 'cancel_all' | 'archive' | 'restore', discardPreparations = false) => run(['validate', 'reopen'].includes(action) ? kind === 'requests' ? 'request.validate' : 'order.validate' : 'write', (repo) => repo.transition(kind, id, updated, action, discardPreparations)),
  generate: (lines: OrderSelection[], key: string) => run('write', (repo) => repo.generate(lines, key)),
  tracking: (quote: string) => run('read', (repo) => repo.tracking(quote)),
  settings: () => run('read', (repo) => repo.settings()),
  saveSettings: (settings: PurchaseSettings) => run('read', (repo) => repo.saveSettings(settings)),
}
