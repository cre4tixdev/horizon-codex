import type { Layout } from '../../documents/schemas/templates'
import { ClientResponseError } from 'pocketbase'
import { environment } from '../../../core/config/environment'
import { sessionService } from '../../../core/auth/services/session'
import { hasPermission } from '../../../core/auth/types/session'
import { createBillingRepository } from '../repositories/BillingRepository'
import type { BillKind, BillInput, PaymentInput, BillingSettings, Bill } from '../schemas/billing'
const repository = environment.pocketBaseUrl ? createBillingRepository(environment.pocketBaseUrl) : undefined
async function run<T>(right: string, call: (repo: ReturnType<typeof createBillingRepository>) => Promise<T>) {
  const session = sessionService.getSnapshot()
  if (!repository || session.status !== 'authenticated' || !hasPermission(session.user, `billing.${right}`)) throw new Error('Accès à la facturation refusé.')
  try { return await call(repository) } catch (error) { console.error('[billing] Operation failed', { status: error instanceof ClientResponseError ? error.status : 0 }); throw new Error(error instanceof ClientResponseError && [400, 403, 404, 409, 503].includes(error.status) ? error.response.message : 'Facturation indisponible. Réessayez.', { cause: error }) }
}
export const billingService = {
  related: (kind: BillKind, id: string) => run('read', (repo) => repo.related(kind, id)),
  tracking: (kind: 'customer' | 'supplier', id: string) => run('read', (repo) => repo.tracking(kind, id)),
  dashboard: () => run('read', (repo) => repo.dashboard()), choices: () => run('read', (repo) => repo.choices()), list: (query: Record<string, string | number>) => run('read', (repo) => repo.list(query)), record: (kind: BillKind, id: string) => run('read', (repo) => repo.record(kind, id)),
  save: (kind: BillKind, input: BillInput, key: string, record?: Bill) => run('write', (repo) => repo.save(kind, input, key, record)), prepare: (kind: BillKind, type: 'order' | 'operation', ids: string[], mode: 'standard' | 'deposit' | 'balance', percent: number) => run('write', (repo) => repo.prepare(kind, type, ids, mode, percent)), credit: (record: Bill) => run('write', (repo) => repo.credit(record.kind, record.id)), transition: (record: Bill, action: string) => run('invoice.validate', (repo) => repo.transition(record, action)),
  upload: (record: Bill, files: File[]) => run('write', (repo) => repo.upload(record, files)), fileURL: (record: Bill, name: string) => run('read', (repo) => repo.fileURL(record, name)), payments: (query: Record<string, string | number>) => run('read', (repo) => repo.payments(query)), pay: (input: PaymentInput) => run('payment.manage', (repo) => repo.pay(input)), cancelPayment: (id: string, updated: string, reason: string) => run('payment.manage', (repo) => repo.cancelPayment(id, updated, reason)), settings: () => run('read', (repo) => repo.settings()), saveSettings: (input: BillingSettings) => run('read', (repo) => repo.saveSettings(input)), preview: (kind: BillKind, id: string, layout?: Layout) => run('read', (repo) => repo.preview(kind, id, layout)), pdf: (kind: BillKind, id: string, layout?: Layout) => run('read', (repo) => repo.pdf(kind, id, layout)),
}
