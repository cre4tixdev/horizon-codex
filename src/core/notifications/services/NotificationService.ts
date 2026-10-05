import { ClientResponseError } from 'pocketbase'
import { environment } from '../../config/environment'
import { createNotificationsRepository } from '../repositories/NotificationsRepository'

class NotificationService {
  private readonly repository = environment.pocketBaseUrl ? createNotificationsRepository(environment.pocketBaseUrl) : undefined
  async inbox() {
    if (!this.repository) return { unread: 0, items: [] }
    try { return await this.repository.inbox() }
    catch (error) {
      console.error('[notifications] Inbox unavailable', { status: error instanceof ClientResponseError ? error.status : 0 })
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
