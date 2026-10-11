import { ClientResponseError } from 'pocketbase'
import { environment } from '../../../core/config/environment'
import { createCalendarRepository } from '../repositories/CalendarRepository'
import type { ManualEventInput } from '../schemas/manualEvents'
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
  private async run<T>(operation: (repository: NonNullable<CalendarService['repository']>) => Promise<T>) {
    if (!this.repository) throw new Error('Calendrier non configuré.')
    try { return await operation(this.repository) } catch (error) {
      console.error('[calendar] Event operation failed', { status: error instanceof ClientResponseError ? error.status : 0 })
      throw new Error(error instanceof ClientResponseError && [400, 403, 404, 409].includes(error.status) ? error.response.message || 'Action refusée.' : 'Impossible de modifier cet événement. Vérifiez l’installation du Calendrier.', { cause: error })
    }
  }
  async manual(id: string) { return this.run((repository) => repository.manual(id)) }
  async saveManual(input: ManualEventInput, key: string, id?: string, updated?: string) { return this.run((repository) => repository.saveManual(input, key, id, updated)) }
  async removeManual(id: string, updated: string) { return this.run((repository) => repository.removeManual(id, updated)) }
  async events(query: CalendarQuery) { return (await this.schedule(query)).items }
}
export const calendarService = new CalendarService(environment.pocketBaseUrl ? createCalendarRepository(environment.pocketBaseUrl) : undefined)
