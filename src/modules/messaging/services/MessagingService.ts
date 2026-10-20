import { ClientResponseError } from 'pocketbase'
import { environment } from '../../../core/config/environment'
import { hasPermission } from '../../../core/auth/types/session'
import { sessionService } from '../../../core/auth/services/session'
import { createMessagingRepository } from '../repositories/MessagingRepository'
import type { EmailContext, PersonalSignatureInput, MailInput, MailMessage, SettingInput, SettingKind } from '../schemas/mail'
const repository = environment.pocketBaseUrl ? createMessagingRepository(environment.pocketBaseUrl) : undefined
async function run<T>(action: string, call: (r: ReturnType<typeof createMessagingRepository>) => Promise<T>) {
  const session = sessionService.getSnapshot()
  if (!repository || session.status !== 'authenticated' || !hasPermission(session.user, 'messaging.read') || !hasPermission(session.user, `messaging.${action}`) || action !== 'read' && session.user.erpProfile === 'viewer') throw new Error('Accès à la messagerie refusé.')
  try { return await call(repository) } catch (error) { console.error('[messaging] Operation failed', { status: error instanceof ClientResponseError ? error.status : 0 }); throw new Error(error instanceof ClientResponseError && [400, 403, 404, 409, 503].includes(error.status) ? error.response.message : 'Messagerie indisponible. Réessayez.', { cause: error }) }
}
export const messagingService = {
  personalSignatures: () => run('read', (r) => r.personalSignatures()),
  savePersonalSignature: (input: PersonalSignatureInput, id?: string, updated?: string) => run('write', (r) => r.savePersonalSignature(input, id, updated)),
  syncReplies: (mailbox: string) => run('settings', (r) => r.syncReplies(mailbox)),
  connect: (mailbox: string) => run('settings', (r) => r.connect(mailbox)), completeConnection: (state: string, code: string) => run('settings', (r) => r.completeConnection(state, code)), disconnect: (mailbox: string) => run('settings', (r) => r.disconnect(mailbox)),
  choices: (context: EmailContext = 'generic', source = '', message = '') => run('read', (r) => r.choices(context, source, message)), render: (context: EmailContext, source: string, template: string, mailbox: string, signature: string) => run('read', (r) => r.render(context, source, template, mailbox, signature)), record: (id: string) => run('read', (r) => r.record(id)), list: (q: Record<string, string>) => run('read', (r) => r.list(q)),
  save: (input: MailInput, key: string, files: File[], removed: string[], record?: MailMessage) => run('write', (r) => r.save(input, key, files, removed, record)), transition: (record: MailMessage, action: string, reason = '') => run(['enqueue', 'resolve'].includes(action) ? 'send' : 'write', (r) => r.transition(record, action, reason)), settingsPreview: (subject: string, body: MailInput['body_json']) => run('settings', (r) => r.settingsPreview(subject, body)), settings: () => run('settings', (r) => r.settings()), saveSetting: (kind: SettingKind, input: SettingInput, id?: string, updated?: string) => run('settings', (r) => r.saveSetting(kind, input, id, updated)), fileURL: (r: MailMessage, name: string) => run('read', (s) => s.fileURL(r, name)), pdf: (context: EmailContext, source: string, template: string) => run('read', (r) => r.pdf(context, source, template)),
}
