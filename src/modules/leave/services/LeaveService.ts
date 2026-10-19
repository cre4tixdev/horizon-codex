import { ClientResponseError } from 'pocketbase'
import { environment } from '../../../core/config/environment'
import { sessionService } from '../../../core/auth/services/session'
import { hasPermission } from '../../../core/auth/types/session'
import { createLeaveRepository } from '../repositories/LeaveRepository'
import type { LeaveInput, LeaveRequest, AllocationInput, PolicyInput } from '../schemas/leave'
const repository = environment.pocketBaseUrl ? createLeaveRepository(environment.pocketBaseUrl) : undefined
async function run<T>(action: string, call: (r: ReturnType<typeof createLeaveRepository>) => Promise<T>) {
  const session = sessionService.getSnapshot()
  if (!repository || session.status !== 'authenticated' || !hasPermission(session.user, `leave.${action}`) || action !== 'read' && session.user.erpProfile === 'viewer') throw new Error('Accès aux congés refusé.')
  try { return await call(repository) } catch (error) { console.error('[leave] Operation failed', { status: error instanceof ClientResponseError ? error.status : 0 }); throw new Error(error instanceof ClientResponseError && [400, 403, 404, 409].includes(error.status) ? error.response.message : 'Congés indisponibles. Réessayez.', { cause: error }) }
}
export const leaveService = {
  photo: (id: string) => run('read', (r) => r.photo(id)),
  balances: (year: string) => run('read', (r) => r.balances(year)), choices: () => run('read', (r) => r.choices()), list: (q: Record<string, string>) => run('read', (r) => r.list(q)), record: (id: string) => run('read', (r) => r.record(id)),
  preview: (input: Pick<LeaveInput, 'start_date' | 'end_date' | 'start_half' | 'end_half'>) => run('read', (r) => r.preview(input)),
  save: (input: LeaveInput, key: string, files: File[], removed: string[], record?: LeaveRequest) => run('write', (r) => r.save(input, key, files, removed, record)),
  transition: (record: LeaveRequest, action: string, reason = '', manager = '') => run(['approve', 'reject', 'approve_cancel', 'deny_cancel'].includes(action) ? 'validate' : ['submit', 'declare'].includes(action) ? 'submit' : action === 'reassign' ? 'allocate' : ['archive', 'restore'].includes(action) ? 'read' : 'write', (r) => r.transition(record, action, reason, manager)),
  allocations: (q: Record<string, string>) => run('allocate', (r) => r.allocations(q)), allocate: (input: AllocationInput) => run('allocate', (r) => r.allocate(input)), settings: (input: PolicyInput) => run('settings', (r) => r.settings(input)), calendar: (q: Record<string, string>) => run('read', (r) => r.calendar(q)), fileURL: (record: LeaveRequest, name: string) => run('read', (r) => r.fileURL(record, name)),
}
