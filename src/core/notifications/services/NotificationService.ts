import { ClientResponseError } from 'pocketbase'
import { notificationPreferencesSchema, type NotificationPreferences } from '../schemas/preferences'
import { environment } from '../../config/environment'
import { createNotificationsRepository } from '../repositories/NotificationsRepository'

class NotificationService {
  private readonly repository = environment.pocketBaseUrl ? createNotificationsRepository(environment.pocketBaseUrl) : undefined
  private async action<T>(operation: (repository: NonNullable<typeof this.repository>) => Promise<T>) {
    if (!this.repository) throw new Error('Les notifications ne sont pas configurées.')
    try { return await operation(this.repository) }
    catch (error) {
      if (error instanceof ClientResponseError && error.isAbort) throw error
      console.error('[notifications] Operation failed', { status: error instanceof ClientResponseError ? error.status : 0 })
      throw new Error(error instanceof ClientResponseError && [400, 403, 409].includes(error.status) ? error.response.message || 'Action refusée.' : 'Action indisponible. Vérifiez l’installation du pack Notifications et réessayez.', { cause: error })
    }
  }
  preferences() { return this.action((r) => r.preferences()) }
  savePreferences(input: NotificationPreferences) { return this.action((r) => r.savePreferences(notificationPreferencesSchema.parse(input))) }
  dismiss(id: string) { return this.action((r) => r.dismiss(id)) }
  dismissRead() { return this.action((r) => r.dismissRead()) }
  async inbox() {
    if (!this.repository) return { unread: 0, items: [] }
    try { return await this.repository.inbox() }
    catch (error) {
      if (error instanceof ClientResponseError && error.isAbort) throw error
      console.error('[notifications] Inbox unavailable', { status: error instanceof ClientResponseError ? error.status : 0, reason: error instanceof Error ? error.name : 'Unknown' })
      if (error instanceof ClientResponseError && error.status === 404) throw new Error('Installez le lot Notifications sur PocketBase pour activer la cloche.', { cause: error })
      throw new Error('Les notifications sont indisponibles. Réessayez.', { cause: error })
    }
  }
  async markRead(id: string) {
    if (!this.repository) return
    try { await this.repository.markRead(id) }
    catch { console.error('[notifications] Mark read failed'); throw new Error('La notification n’a pas pu être marquée comme lue.') }
  }
}
export const notificationService = new NotificationService()
