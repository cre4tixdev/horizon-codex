import { sendPdf } from '../../../core/pocketbase/pdf'
import { z } from 'zod'
import { createPocketBaseClient } from '../../../core/pocketbase/client'
import { templateSchema, templateChoiceSchema, type Layout, type DocumentType } from '../schemas/templates'
import { paperFormatSchema, type PaperFormatInput } from '../schemas/paperFormats'
import { fileSettingsSchema, type FileSettings } from '../schemas/fileSettings'
export type PreviewInput = ({ stock_operation_id: string; quote_id?: never; product_id?: never; purchase_order_id?: never } | { purchase_order_id: string; quote_id?: never; product_id?: never } | { quote_id: string; product_id?: never } | { product_id: string; quote_id?: never }) & { template_id?: string; content_json?: Layout }
export function createDocumentsRepository(url: string) {
  const client = createPocketBaseClient(url)
  return {
    async paperFormats() { return z.object({ items: z.array(paperFormatSchema) }).parse(await client.send('/api/horizon/documents/paper-formats', { method: 'GET', requestKey: null })).items },
    async savePaperFormat(input: PaperFormatInput) { return paperFormatSchema.parse(await client.send('/api/horizon/documents/paper-formats', { method: 'POST', body: input, requestKey: null })) },
    async fileSettings() { return fileSettingsSchema.parse(await client.send('/api/horizon/documents/file-settings', { method: 'GET', requestKey: null })) },
    async saveFileSettings(input: FileSettings) { return fileSettingsSchema.parse(await client.send('/api/horizon/documents/file-settings', { method: 'POST', body: input, requestKey: null })) },
    async list() { return z.object({ items: z.array(templateChoiceSchema) }).parse(await client.send('/api/horizon/documents/templates', { method: 'GET', requestKey: null })).items },
    async record(id: string) { return templateSchema.parse(await client.send(`/api/horizon/documents/templates/${id}`, { method: 'GET', requestKey: null })) },
    async save(name: string, content_json: Layout, id?: string, updated?: string, document_type: DocumentType = 'quote') { return templateSchema.parse(await client.send('/api/horizon/documents/templates/save', { method: 'POST', body: { name, content_json, document_type, ...(id ? { id, updated } : {}) }, requestKey: null })) },
    async publish(id: string, updated: string) { return templateSchema.parse(await client.send('/api/horizon/documents/templates/publish', { method: 'POST', body: { id, updated }, requestKey: null })) },
    async delete(id: string, updated: string) { return z.object({ deleted: z.literal(true) }).parse(await client.send('/api/horizon/documents/templates/delete', { method: 'POST', body: { id, updated }, requestKey: null })) },
    async archive(id: string, updated: string) { return templateSchema.parse(await client.send('/api/horizon/documents/templates/archive', { method: 'POST', body: { id, updated }, requestKey: null })) },
    async preview(input: PreviewInput) { return z.object({ html: z.string(), warnings: z.array(z.string()), filename: z.string().optional(), page: z.object({ name: z.string().optional(), format: z.enum(['A4', 'Personnalisé']), orientation: z.enum(['portrait', 'landscape']), width: z.number(), height: z.number() }).optional() }).parse(await client.send('/api/horizon/documents/preview', { method: 'POST', body: { ...input, format: 'html' }, requestKey: null })) },
    pdf: (input: PreviewInput) => sendPdf(client, '/api/horizon/documents/preview', { ...input, format: 'pdf' }),
  }
}
