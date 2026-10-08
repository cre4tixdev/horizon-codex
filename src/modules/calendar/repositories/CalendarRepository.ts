import { createPocketBaseClient } from '../../../core/pocketbase/client'
import { calendarResponseSchema, type CalendarQuery } from '../schemas/events'
export function createCalendarRepository(url: string) {
  const client = createPocketBaseClient(url)
  return { async schedule(query: CalendarQuery) { return calendarResponseSchema.parse(await client.send('/api/horizon/calendar/events', { method: 'GET', query: { from: query.from, to: query.to, scope: query.scope || 'all', q: query.search || '', state: query.archived ? 'archived' : 'active', company: query.company || '', owner: query.owner || '', status: query.status || '', preparation_status: query.preparationStatus || '', tag: query.tag || '' }, requestKey: null })) } }
}
