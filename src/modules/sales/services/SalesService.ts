import { ClientResponseError } from 'pocketbase'
import { copyQuoteContent } from './quoteCopy'
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
  summary: (options: Pick<QuoteListOptions, 'q' | 'opportunity' | 'company'>) => run(false, (repo) => repo.summary(options)),
  copyContent: (sourceId: string, sourceUpdated: string, target: QuoteInput, currency: string) => run(true, async (repo) => {
    const source = await repo.record(sourceId)
    if (source.updated !== sourceUpdated) throw new Error('Le devis source a changé. Recherchez-le à nouveau avant de copier.')
    if (source.currency !== currency) throw new Error('Le devis source doit utiliser la même devise que le devis ouvert.')
    return copyQuoteContent(source, target)
  }),
  manage: (id: string, updated: string, action: 'archive' | 'restore') => run(true, (repo) => repo.manage(id, updated, action)),
  remove: (id: string, updated: string) => run(true, (repo) => repo.remove(id, updated)),
  reopen: (id: string, updated: string, target: 'draft' | 'validated') => run(false, (repo) => repo.reopen(id, updated, target)),
  salespeople: () => run(false, (repo) => repo.salespeople()),
  finalize: (id: string, updated: string) => run(false, (repo) => repo.finalize(id, updated)),
  confirm: (id: string, updated: string, number: string, file?: File) => {
    if (file && (file.size > 10485760 || !['application/pdf', 'image/png', 'image/jpeg', 'image/webp'].includes(file.type))) throw new Error('Choisissez un PDF ou une image de 10 Mio maximum.')
    return run(false, (repo) => repo.confirm(id, updated, number, file))
  },
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
