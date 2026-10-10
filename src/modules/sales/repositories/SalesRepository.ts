import { z } from 'zod'
import { createPocketBaseClient } from '../../../core/pocketbase/client'
import { salesSettingsSchema, type SalesSettings, opportunityChoiceSchema, quotePageSchema, quoteSchema, relatedSalesSchema, type QuoteInput, type QuoteListOptions } from '../schemas/quotes'
export function createSalesRepository(url: string) {
  const client = createPocketBaseClient(url)
  return {
    async summary(query: Pick<QuoteListOptions, 'q' | 'opportunity' | 'company'>) { return z.object({ draft: z.number().int().nonnegative(), validated: z.number().int().nonnegative(), sent: z.number().int().nonnegative(), accepted: z.number().int().nonnegative() }).parse(await client.send('/api/horizon/sales/quotes/summary', { method: 'GET', query, requestKey: null })) },
    async manage(id: string, updated: string, action: 'archive' | 'restore') { return quoteSchema.parse(await client.send('/api/horizon/sales/quotes/manage', { method: 'POST', body: { id, updated, action }, requestKey: null })) },
    async remove(id: string, updated: string) { return z.object({ deleted: z.literal(true) }).parse(await client.send('/api/horizon/sales/quotes/manage', { method: 'POST', body: { id, updated, action: 'delete' }, requestKey: null })) },
    async reopen(id: string, updated: string, target: 'draft' | 'validated') { return quoteSchema.parse(await client.send('/api/horizon/sales/quotes/reopen', { method: 'POST', body: { id, updated, target }, requestKey: null })) },
    async salespeople() { return z.object({ items: z.array(z.object({ id: z.string(), name: z.string() })) }).parse(await client.send('/api/horizon/sales/salespeople', { method: 'GET', requestKey: null })).items },
    async finalize(id: string, updated: string) { return quoteSchema.parse(await client.send('/api/horizon/sales/quotes/finalize', { method: 'POST', body: { id, updated }, requestKey: null })) },
    async confirm(id: string, updated: string, number: string, file?: File) { const body = new FormData(); body.set('id', id); body.set('updated', updated); body.set('customer_order_number', number); if (file) body.set('command_file', file); return quoteSchema.parse(await client.send('/api/horizon/sales/quotes/confirm', { method: 'POST', body, requestKey: null })) },
    async settings() { return salesSettingsSchema.parse(await client.send('/api/horizon/sales/settings', { method: 'GET', requestKey: null })) },
    async saveSettings(record: SalesSettings) { return salesSettingsSchema.parse(await client.send('/api/horizon/sales/settings', { method: 'POST', body: { updated: record.updated, column_widths: record.column_widths, validity_days: record.validity_days, default_tax_rate: record.default_tax_rate, terms: record.terms }, requestKey: null })) },
    async list(query: QuoteListOptions) { return quotePageSchema.parse(await client.send('/api/horizon/sales/quotes', { method: 'GET', query, requestKey: null })) },
    async record(id: string) { return quoteSchema.parse(await client.send(`/api/horizon/sales/quotes/${id}`, { method: 'GET', requestKey: null })) },
    async choices(q: string) { return z.object({ items: z.array(opportunityChoiceSchema) }).parse(await client.send('/api/horizon/sales/choices', { method: 'GET', query: { q }, requestKey: null })).items },
    async choice(id: string) { return opportunityChoiceSchema.parse(await client.send('/api/horizon/sales/choices', { method: 'GET', query: { selected: id }, requestKey: null })) },
    async save(input: QuoteInput, creation_key: string, id?: string, updated?: string) { return quoteSchema.parse(await client.send('/api/horizon/sales/quotes/save', { method: 'POST', body: { input, creation_key, ...(id ? { id, updated } : {}) }, requestKey: null })) },
    async cancel(id: string, updated: string, reason: string) { return quoteSchema.parse(await client.send('/api/horizon/sales/quotes/cancel', { method: 'POST', body: { id, updated, reason }, requestKey: null })) },
    async related(id: string) { return relatedSalesSchema.parse(await client.send(`/api/horizon/sales/opportunities/${id}`, { method: 'GET', requestKey: null })) },
  }
}
