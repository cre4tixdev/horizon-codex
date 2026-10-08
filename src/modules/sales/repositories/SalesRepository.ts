import { z } from 'zod'
import { createPocketBaseClient } from '../../../core/pocketbase/client'
import { salesSettingsSchema, type SalesSettings, opportunityChoiceSchema, quotePageSchema, quoteSchema, relatedSalesSchema, type QuoteInput, type QuoteListOptions } from '../schemas/quotes'
export function createSalesRepository(url: string) {
  const client = createPocketBaseClient(url)
  return {
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
