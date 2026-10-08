import { ClientResponseError } from 'pocketbase'
import { environment } from '../../../core/config/environment'
import { createCalendarRepository } from '../repositories/CalendarRepository'
import type { CalendarQuery } from '../schemas/events'
export class CalendarService {
  constructor(private readonly repository: ReturnType<typeof createCalendarRepository> | undefined) {}
  async schedule(query: CalendarQuery) {
    if (!this.repository) throw new Error('Calendrier non configuré.')
    try { return await this.repository.schedule(query) } catch (error) {
      console.error('[calendar] Events unavailable', { status: error instanceof ClientResponseError ? error.status : 0 })
      throw new Error(error instanceof ClientResponseError && error.status === 400 ? error.response.message || 'Période invalide.' : 'Le calendrier est indisponible. Vérifiez l’installation du lot Calendrier / AO.', { cause: error })
    }
  }
  async events(query: CalendarQuery) { return (await this.schedule(query)).items }
}
export const calendarService = new CalendarService(environment.pocketBaseUrl ? createCalendarRepository(environment.pocketBaseUrl) : undefined)
