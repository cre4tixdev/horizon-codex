import { ClientResponseError } from 'pocketbase'
import { environment } from '../../../core/config/environment'
import { sessionService } from '../../../core/auth/services/session'
import { hasPermission } from '../../../core/auth/types/session'
import { createExpensesRepository } from '../repositories/ExpensesRepository'
import type { ExpenseReport, ExpenseInput, ReportInput, ExpenseLine, ExpenseCategory, ExpenseVehicle, ExpenseVehicleInput } from '../schemas/expenses'
const repository = environment.pocketBaseUrl ? createExpensesRepository(environment.pocketBaseUrl) : undefined
async function run<T>(right: string, call: (repo: ReturnType<typeof createExpensesRepository>) => Promise<T>) {
  const session = sessionService.getSnapshot()
  if (!repository || session.status !== 'authenticated' || !hasPermission(session.user, right === 'settings.references' ? right : `expenses.${right}`)) throw new Error('Accès aux notes de frais refusé.')
  try { return await call(repository) } catch (error) { console.error('[expenses] Operation failed', { status: error instanceof ClientResponseError ? error.status : 0 }); throw new Error(error instanceof ClientResponseError && [400, 403, 404, 409].includes(error.status) ? error.response.message : 'Notes de frais indisponibles. Réessayez.', { cause: error }) }
}
export const expensesService = {
  vehicles: () => run('settings.references', (r) => r.vehicles()), vehicle: (input: ExpenseVehicleInput, record?: ExpenseVehicle) => run('settings.references', (r) => r.vehicle(input, record)),
  overview: (q: Record<string, string | number>) => run('read', (r) => r.overview(q)),
  choices: () => run('read', (r) => r.choices()), list: (q: Record<string, string | number>) => run('read', (r) => r.list(q)), record: (id: string) => run('read', (r) => r.record(id)),
  save: (input: ReportInput, record?: ExpenseReport) => run('write', (r) => r.save(input, record)), line: (record: ExpenseReport, input: ExpenseInput, files: File[], removed: string[], line?: ExpenseLine) => run('write', (r) => r.line(record, input, files, removed, line)), order: (record: ExpenseReport, ids: string[]) => run('write', (r) => r.order(record, ids)), remove: (record: ExpenseReport, id: string) => run('write', (r) => r.remove(record, id)),
  transition: (record: ExpenseReport, action: string, extra: { reason?: string; date?: string; reference?: string; validator?: string } = {}) => run(['validate', 'return', 'reassign'].includes(action) ? 'validate' : action === 'reimburse' ? 'reimburse' : action === 'submit' ? 'submit' : 'write', (r) => r.transition(record, action, extra)), fileURL: (line: ExpenseLine, name: string) => run('read', (r) => r.fileURL(line, name)), categories: () => run('settings.references', (r) => r.categories()), category: (input: Omit<ExpenseCategory, 'id' | 'updated'>, record?: ExpenseCategory) => run('settings.references', (r) => r.category(input, record)),
}
