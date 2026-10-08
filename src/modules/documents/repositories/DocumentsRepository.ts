import { z } from 'zod'
import { createPocketBaseClient } from '../../../core/pocketbase/client'
import { templateSchema, templateChoiceSchema, type Layout } from '../schemas/templates'
export type PreviewInput = { quote_id: string; template_id?: string; content_json?: Layout }
export function createDocumentsRepository(url: string) {
  const client = createPocketBaseClient(url)
  return {
    async list() { return z.object({ items: z.array(templateChoiceSchema) }).parse(await client.send('/api/horizon/documents/templates', { method: 'GET', requestKey: null })).items },
    async record(id: string) { return templateSchema.parse(await client.send(`/api/horizon/documents/templates/${id}`, { method: 'GET', requestKey: null })) },
    async save(name: string, content_json: Layout, id?: string, updated?: string) { return templateSchema.parse(await client.send('/api/horizon/documents/templates/save', { method: 'POST', body: { name, content_json, ...(id ? { id, updated } : {}) }, requestKey: null })) },
    async publish(id: string, updated: string) { return templateSchema.parse(await client.send('/api/horizon/documents/templates/publish', { method: 'POST', body: { id, updated }, requestKey: null })) },
    async archive(id: string, updated: string) { return templateSchema.parse(await client.send('/api/horizon/documents/templates/archive', { method: 'POST', body: { id, updated }, requestKey: null })) },
    async preview(input: PreviewInput) { return z.object({ html: z.string(), warnings: z.array(z.string()) }).parse(await client.send('/api/horizon/documents/preview', { method: 'POST', body: { ...input, format: 'html' }, requestKey: null })) },
    async pdf(input: PreviewInput) {
      let pdf: Blob | undefined
      // Use the SDK's transport/auth/error handling; replace only binary response decoding.
      await client.send('/api/horizon/documents/preview', { method: 'POST', body: { ...input, format: 'pdf' }, requestKey: null, fetch: async (request, init) => {
        const response = await fetch(request, init)
        if (!response.ok) return response
        pdf = await response.blob()
        return new Response('{}', { status: 200, headers: { 'Content-Type': 'application/json' } })
      } })
      if (!pdf || pdf.type !== 'application/pdf') throw new Error('Réponse PDF invalide.')
      return pdf
    },
  }
}
