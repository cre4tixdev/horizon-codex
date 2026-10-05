import { z } from 'zod'
import { createPocketBaseClient } from '../../pocketbase/client'

const notificationSchema = z.object({ id: z.string(), title: z.string(), body: z.string(), read_at: z.string(), created: z.string(), source_entity: z.string(), source_record_id: z.string() })
export function createNotificationsRepository(url: string) {
  const client = createPocketBaseClient(url)
  return {
    async inbox() {
      const [unread, recent] = await Promise.all([
        client.collection('core_notifications').getList(1, 1, { filter: 'read_at = ""', fields: 'id', requestKey: null }),
        client.collection('core_notifications').getList(1, 30, { sort: '-created,-id', requestKey: null }),
      ])
      return { unread: z.number().int().nonnegative().parse(unread.totalItems), items: z.array(notificationSchema).parse(recent.items) }
    },
    async markRead(id: string) { await client.collection('core_notifications').update(id, { read_at: new Date().toISOString() }, { requestKey: null }) },
  }
}
