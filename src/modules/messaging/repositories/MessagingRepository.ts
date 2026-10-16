import { z } from 'zod'
import { createPocketBaseClient } from '../../../core/pocketbase/client'
import { sendPdf } from '../../../core/pocketbase/pdf'
import { choicesSchema, messageSchema, listSchema, renderedSchema, settingsSchema, type EmailContext, type MailInput, type MailMessage, type SettingInput, type SettingKind } from '../schemas/mail'
export function createMessagingRepository(url: string) {
  const client = createPocketBaseClient(url), get = (path: string, query?: Record<string, string>) => client.send('/api/horizon/messaging' + path, { method: 'GET', ...(query ? { query } : {}), requestKey: null }), post = (path: string, body: object | FormData) => client.send('/api/horizon/messaging' + path, { method: 'POST', body, requestKey: null })
  return {
    async choices(context: EmailContext, source: string, message = '') { return choicesSchema.parse(await get('/choices', { context, source, message })) },
    async render(context: EmailContext, source: string, template: string, mailbox: string, signature: string) { return renderedSchema.parse(await post('/render', { context, source, template, mailbox, signature })) },
    async record(id: string) { return messageSchema.parse(await get('/messages/' + id)) },
    async list(query: Record<string, string>) { return listSchema.parse(await get('/messages', query)) },
    async save(input: MailInput, key: string, files: File[], removed: string[], record?: MailMessage) { const data = new FormData(); data.set('input', JSON.stringify(input)); data.set('removed', JSON.stringify(removed)); if (record) { data.set('id', record.id); data.set('updated', record.updated) } else data.set('creation_key', key); files.forEach((file) => data.append('attachments', file)); return messageSchema.parse(await post('/messages', data)) },
    async transition(r: MailMessage, action: string, reason = '') { return messageSchema.parse(await post('/messages/' + r.id + '/transition', { updated: r.updated, action, reason })) },
    async settingsPreview(subject: string, body_json: MailInput['body_json']) { return renderedSchema.parse(await post('/settings/preview', { subject, body_json })) },
    async connect(mailbox: string) { return z.object({ url: z.url() }).parse(await post('/oauth/start', { mailbox })) },
    async completeConnection(state: string, code: string) { return z.object({ connected: z.literal(true) }).parse(await post('/oauth/callback', { state, code })) },
    async disconnect(mailbox: string) { await post('/oauth/disconnect', { mailbox }) },
    async syncReplies(mailbox: string) { return z.object({ received: z.number() }).parse(await post('/replies/sync', { mailbox })) },
    async settings() { return settingsSchema.parse(await get('/settings')) },
    async saveSetting(kind: SettingKind, input: SettingInput, id?: string, updated?: string) { await post('/settings', { kind, input, ...(id ? { id, updated } : {}) }) },
    async fileURL(r: MailMessage, name: string) { return client.files.getURL(r, name, { token: await client.files.getToken({ requestKey: null }) }) },
    pdf: (context: EmailContext, source: string, pdf_template: string) => sendPdf(client, '/api/horizon/messaging/preview', { context, source, pdf_template }),
  }
}
