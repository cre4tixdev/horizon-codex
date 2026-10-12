import { z } from 'zod'
import { createPocketBaseClient } from '../../../core/pocketbase/client'
import { purchaseSchema, purchasePageSchema, choicesSchema, needsSchema, productPurchaseSchema, purchaseSettingsSchema, trackingSchema, type PurchaseKind, type PurchaseInput, type PurchaseListOptions, type PurchaseSettings, type OrderSelection } from '../schemas/purchasing'
export function createPurchasingRepository(url: string) {
  const client = createPocketBaseClient(url)
  const send = (path: string, body?: unknown, query?: object) => client.send('/api/horizon/purchasing/' + path, { method: body === undefined ? 'GET' : 'POST', ...(body !== undefined ? { body } : {}), ...(query ? { query } : {}), requestKey: null })
  return {
    async list(kind: PurchaseKind, query: PurchaseListOptions) { return purchasePageSchema.parse(await send(kind, undefined, query)) },
    async record(kind: PurchaseKind, id: string) { return purchaseSchema.parse(await send(`${kind}/${id}`)) },
    async choices() { return choicesSchema.parse(await send('choices')) },
    async needs(quote: string, preview = false) { return needsSchema.parse(await send('needs/' + quote, undefined, preview ? { preview: true } : undefined)) },
    async product(id: string, currency: string, supplier = '') { return productPurchaseSchema.parse(await send('products/' + id, undefined, { currency, supplier })) },
    async save(kind: PurchaseKind, input: PurchaseInput, creation_key: string, id?: string, updated?: string) { return purchaseSchema.parse(await send(kind + '/save', { input, creation_key, ...(id ? { id, updated } : {}) })) },
    async transition(kind: PurchaseKind, id: string, updated: string, action: 'validate' | 'reopen' | 'cancel' | 'cancel_all' | 'archive' | 'restore', discardPreparations = false) { return purchaseSchema.parse(await send(kind + '/transition', { id, updated, action, discard_preparations: discardPreparations })) },
    async generate(lines: OrderSelection[], creation_key: string) { return z.object({ items: z.array(purchaseSchema) }).parse(await send('generate-orders', { lines, creation_key })).items },
    async tracking(quote: string) { return z.record(z.string(), trackingSchema).parse(await send('tracking/' + quote)) },
    async settings() { return purchaseSettingsSchema.parse(await send('settings')) },
    async saveSettings(settings: PurchaseSettings) { return purchaseSettingsSchema.parse(await send('settings', { updated: settings.updated, default_tax_rate: settings.default_tax_rate, default_lead_days: settings.default_lead_days })) },
  }
}
