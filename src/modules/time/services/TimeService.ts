import { ClientResponseError } from 'pocketbase'
import { environment } from '../../../core/config/environment'
import { sessionService } from '../../../core/auth/services/session'
import { hasPermission } from '../../../core/auth/types/session'
import { createTimeRepository } from '../repositories/TimeRepository'
import type { TimeInput, TimeSheet } from '../schemas/time'
export function createTimeService(repository: ReturnType<typeof createTimeRepository> | undefined, session: Pick<typeof sessionService, 'getSnapshot'> = sessionService) {
  async function run<T>(action: string, call: (r: ReturnType<typeof createTimeRepository>) => Promise<T>) {
    const snapshot = session.getSnapshot()
    if (!repository || snapshot.status !== 'authenticated' || !hasPermission(snapshot.user, 'time.read') || !hasPermission(snapshot.user, `time.${action}`) || action !== 'read' && snapshot.user.erpProfile === 'viewer') throw new Error('Accès TimeReport refusé.')
    try { return await call(repository) } catch (error) { console.error('[time] Operation failed', { status: error instanceof ClientResponseError ? error.status : 0 }); throw new Error(error instanceof ClientResponseError && [400, 403, 404, 409].includes(error.status) ? error.response.message : 'Temps indisponibles. Réessayez.', { cause: error }) }
  }
  return {
    photo: (id: string) => run('read', (r) => r.photo(id)), overview: (q: Record<string, string>) => run('read', (r) => r.overview(q)), choices: () => run('read', (r) => r.choices()), week: (date: string) => run('read', (r) => r.week(date)), record: (id: string) => run('read', (r) => r.record(id)), list: (q: Record<string, string>) => run('read', (r) => r.list(q)), accounts: (q: string) => run('read', (r) => r.accounts(q)), sold: (account: string, product: string) => run('read', (r) => r.sold(account, product)), save: (input: TimeInput) => run('write', (r) => r.save(input)),
    transition: (sheet: TimeSheet, action: string, manager = '', reason = '') => run(['validate', 'reject', 'reopen_validated'].includes(action) ? 'validate' : action === 'submit' ? 'submit' : 'write', (r) => r.transition(sheet, action, manager, reason)),
    favorite: (input: object) => run('write', (r) => r.favorite(input)), settings: (q = '') => run('settings', (r) => r.settings(q)), saveSettings: (area: 'activities' | 'resources', input: object) => run('settings', (r) => r.saveSettings(area, input)),
  }
}
export const timeService = createTimeService(environment.pocketBaseUrl ? createTimeRepository(environment.pocketBaseUrl) : undefined)
