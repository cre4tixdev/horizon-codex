import type { Layout } from '../../documents/schemas/templates'
import { sendPdf } from '../../../core/pocketbase/pdf'
import { z } from 'zod'
import { createPocketBaseClient } from '../../../core/pocketbase/client'
import { billSchema, pageSchema, choicesSchema, preparedSchema, dashboardSchema, paymentsSchema, settingsSchema, previewSchema, type BillKind, type BillInput, type PaymentInput, type BillingSettings, type Bill } from '../schemas/billing'
export function createBillingRepository(url: string) {
  const client = createPocketBaseClient(url), base = '/api/horizon/billing'
  const post = (path: string, body: object) => client.send(base + path, { method: 'POST', body, requestKey: null })
  return {
    async related(kind: BillKind, id: string) { const item = z.object({ id: z.string(), label: z.string(), reference: z.string(), href: z.string() }); return z.object({ orders: z.array(item), deliveries: z.array(item) }).parse(await client.send(`${base}/related/${kind}/${id}`, { requestKey: null })) },
    async tracking(kind: 'customer' | 'supplier', id: string) { return z.record(z.string(), z.object({ ordered: z.number(), delivered: z.number(), invoiced: z.number(), prepared: z.number() })).parse(await client.send(`${base}/tracking/${kind}/${id}`, { requestKey: null })) },
    async dashboard() { return dashboardSchema.parse(await client.send(base + '/dashboard', { requestKey: null })) },
    async choices() { return choicesSchema.parse(await client.send(base + '/choices', { requestKey: null })) },
    async list(query: Record<string, string | number>) { return pageSchema.parse(await client.send(base + '/documents', { query, requestKey: null })) },
    async record(kind: BillKind, id: string) { return billSchema.parse(await client.send(`${base}/record/${kind}/${id}`, { requestKey: null })) },
    async save(kind: BillKind, input: BillInput, creation_key: string, record?: Bill) { return billSchema.parse(await post('/documents/save', { kind, input, creation_key, ...(record ? { id: record.id, updated: record.updated } : {}) })) },
    async prepare(kind: BillKind, source_type: 'order' | 'operation', source_ids: string[], mode: 'standard' | 'deposit' | 'balance', deposit_percent: number) { return preparedSchema.parse(await post('/documents/prepare', { kind, source_type, source_ids, mode, deposit_percent })) },
    async credit(kind: BillKind, id: string) { return preparedSchema.parse(await post('/documents/credit', { kind, id })) },
    async transition(record: Bill, action: string) { return billSchema.parse(await post('/documents/transition', { kind: record.kind, id: record.id, updated: record.updated, action })) },
    async upload(record: Bill, files: File[]) { const body = new FormData(); body.set('updated', record.updated); for (const file of files) body.append('attachments', file); return billSchema.parse(await client.send(`${base}/files/${record.kind}/${record.id}`, { method: 'POST', body, requestKey: null })) },
    async fileURL(record: Bill, name: string) { const token = await client.files.getToken({ requestKey: null }); return client.files.getURL({ collectionId: record.collectionId, id: record.id }, name, { token }) },
    async payments(query: Record<string, string | number>) { return paymentsSchema.parse(await client.send(base + '/payments', { query, requestKey: null })) },
    async pay(input: PaymentInput) { return z.object({ id: z.string() }).parse(await post('/payments', input)) },
    async cancelPayment(id: string, updated: string, reason: string) { return z.object({ cancelled: z.boolean() }).parse(await post('/payments/cancel', { id, updated, reason })) },
    async settings() { return settingsSchema.parse(await client.send(base + '/settings', { requestKey: null })) },
    async saveSettings(input: BillingSettings) { return settingsSchema.parse(await post('/settings', input)) },
    async preview(kind: BillKind, id: string, layout?: Layout) { return previewSchema.parse(await post('/preview', { kind, id, format: 'html', ...(layout ? { content_json: layout } : {}) })) },
    pdf: (kind: BillKind, id: string, layout?: Layout) => sendPdf(client, base + '/preview', { kind, id, format: 'pdf', ...(layout ? { content_json: layout } : {}) }),
  }
}
