import { ClientResponseError } from 'pocketbase'
import { environment } from '../../../core/config/environment'
import { hasPermission } from '../../../core/auth/types/session'
import { sessionService } from '../../../core/auth/services/session'
import { createSalesRepository } from '../repositories/SalesRepository'
import { quoteInputSchema, type QuoteInput, type QuoteListOptions, type SalesSettings } from '../schemas/quotes'
const repository = environment.pocketBaseUrl ? createSalesRepository(environment.pocketBaseUrl) : undefined
async function run<T>(write: boolean, action: (repo: ReturnType<typeof createSalesRepository>) => Promise<T>): Promise<T> {
  const session = sessionService.getSnapshot()
  if (session.status !== 'authenticated' || !hasPermission(session.user, 'sales.read') || write && !hasPermission(session.user, 'sales.write')) throw new Error('Vous ne disposez pas des droits sur les devis.')
  if (!repository) throw new Error('Le module Ventes n’est pas configuré.')
  try { return await action(repository) } catch (error) {
    console.error('[sales] Operation failed', { status: error instanceof ClientResponseError ? error.status : 0 })
    if (error instanceof ClientResponseError && [400, 403, 404, 409].includes(error.status)) throw new Error(error.response.message || 'Devis inaccessible ou modification refusée.', { cause: error })
    throw new Error('Les devis sont indisponibles. Réessayez.', { cause: error })
  }
}
async function settingsRun(write: boolean, action: (repo: ReturnType<typeof createSalesRepository>) => Promise<SalesSettings>) {
  const session = sessionService.getSnapshot()
  if (session.status !== 'authenticated' || !(hasPermission(session.user, 'settings.references') || !write && hasPermission(session.user, 'sales.read'))) throw new Error('Accès aux paramètres Ventes refusé.')
  if (!repository) throw new Error('Ventes n’est pas configuré.')
  try { return await action(repository) } catch (error) { console.error('[sales-settings] Operation failed', { status: error instanceof ClientResponseError ? error.status : 0 }); throw new Error(error instanceof ClientResponseError && [400, 403, 409].includes(error.status) ? error.response.message : 'Paramètres Ventes indisponibles.', { cause: error }) }
}
export const salesService = {
  settings: () => settingsRun(false, (repo) => repo.settings()),
  saveSettings: (record: SalesSettings) => settingsRun(true, (repo) => repo.saveSettings(record)),
  list: (options: QuoteListOptions) => run(false, (repo) => repo.list(options)),
  record: (id: string) => run(false, (repo) => repo.record(id)),
  choices: (q: string) => run(false, (repo) => repo.choices(q)),
  choice: (id: string) => run(false, (repo) => repo.choice(id)),
  related: (id: string) => run(false, async (repo) => {
    const related = await repo.related(id)
    const quotes = related.quoteCount === 1 ? await repo.list({ q: '', opportunity: id, company: '', status: '', sort: 'quote_number', page: 1 }) : undefined
    return { ...related, singleQuoteId: quotes?.totalItems === 1 ? quotes.items[0]?.id : undefined }
  }),
  save: (input: QuoteInput, key: string, id?: string, updated?: string) => run(true, (repo) => repo.save(quoteInputSchema.parse(input), key, id, updated)),
  cancel: (id: string, updated: string, reason: string) => run(true, (repo) => repo.cancel(id, updated, reason)),
}
