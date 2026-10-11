import { z } from 'zod'
import { manualEventSchema, type ManualEventInput } from '../schemas/manualEvents'
import { createPocketBaseClient } from '../../../core/pocketbase/client'
import { calendarResponseSchema, type CalendarQuery } from '../schemas/events'
export function createCalendarRepository(url: string) {
  const client = createPocketBaseClient(url)
  return {
    async manual(id: string) { return manualEventSchema.parse(await client.send(`/api/horizon/calendar/manual/${id}`, { method: 'GET', requestKey: null })) },
    async saveManual(input: ManualEventInput, creation_key: string, id?: string, updated?: string) { return manualEventSchema.parse(await client.send('/api/horizon/calendar/manual/save', { method: 'POST', body: { input, creation_key, ...(id ? { id, updated } : {}) }, requestKey: null })) },
    async removeManual(id: string, updated: string) { return z.object({ success: z.literal(true) }).parse(await client.send('/api/horizon/calendar/manual/remove', { method: 'POST', body: { id, updated }, requestKey: null })) },
    async schedule(query: CalendarQuery) { return calendarResponseSchema.parse(await client.send('/api/horizon/calendar/events', { method: 'GET', query: { from: query.from, to: query.to, scope: query.scope || 'all', q: query.search || '', state: query.archived ? 'archived' : 'active', company: query.company || '', owner: query.owner || '', status: query.status || '', preparation_status: query.preparationStatus || '', tag: query.tag || '' }, requestKey: null })) } }
}
