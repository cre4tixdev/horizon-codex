import { z } from 'zod'
import { notificationPreferencesSchema, type NotificationPreferences } from '../schemas/preferences'
import { createPocketBaseClient } from '../../pocketbase/client'

const notificationSchema = z.object({ id: z.string(), title: z.string(), body: z.string(), read_at: z.string(), created: z.string(), source_entity: z.string(), source_record_id: z.string() })
export function createNotificationsRepository(url: string) {
  const client = createPocketBaseClient(url)
  return {
    async inbox() {
      const signal = AbortSignal.timeout(15_000)
      try {
        return z.object({ unread: z.number().int().nonnegative(), items: z.array(notificationSchema) }).parse(await client.send('/api/horizon/notifications/inbox', { method: 'GET', requestKey: null, signal }))
      } catch (error) {
        if (signal.aborted) throw new Error('Le chargement des notifications a dépassé le délai. Réessayez.', { cause: error })
        throw error
      }
    },
    async preferences() { return notificationPreferencesSchema.parse(await client.send('/api/horizon/notifications/preferences', { method: 'GET', requestKey: null })) },
    async savePreferences(input: NotificationPreferences) { return notificationPreferencesSchema.parse(await client.send('/api/horizon/notifications/preferences', { method: 'POST', body: input, requestKey: null })) },
    async dismiss(id: string) { await client.send(`/api/horizon/notifications/${id}/dismiss`, { method: 'POST', body: {}, requestKey: null }) },
    async dismissRead() { await client.send('/api/horizon/notifications/dismiss-read', { method: 'POST', body: {}, requestKey: null }) },
    async markRead(id: string) { await client.send(`/api/horizon/notifications/${id}/read`, { method: 'POST', body: {}, requestKey: null, signal: AbortSignal.timeout(15_000) }) },
  }
}
