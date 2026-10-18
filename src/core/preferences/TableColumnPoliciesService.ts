import { ClientResponseError } from 'pocketbase'
import { sessionService } from '../auth/services/session'
import { hasPermission } from '../auth/types/session'
import { environment } from '../config/environment'
import { createTableColumnPoliciesRepository } from './TableColumnPoliciesRepository'
import { tableColumnCatalog, tableColumnPolicySchema, type TableColumnPolicy } from './tableColumnPolicies'
export class TableColumnPoliciesService {
  constructor(private readonly repository: ReturnType<typeof createTableColumnPoliciesRepository> | undefined, private readonly allowed: (write: boolean) => boolean) {}
  private async run<T>(write: boolean, action: (repository: ReturnType<typeof createTableColumnPoliciesRepository>) => Promise<T>) {
    if (!this.allowed(write)) throw new Error('Accès aux réglages des colonnes non autorisé.')
    if (!this.repository) throw new Error('PocketBase n’est pas configuré.')
    try { return await action(this.repository) }
    catch (error) {
      const status = error instanceof ClientResponseError ? error.status : 0
      console.error('[table-column-policies] Request failed', { status })
      if (status === 404) throw new Error('Installez le pack PocketBase Colonnes proposées puis redémarrez PocketBase.', { cause: error })
      if (status === 409) throw new Error('Réglages modifiés ailleurs. Rechargez avant de réessayer.', { cause: error })
      throw new Error('Réglages des colonnes indisponibles. Réessayez.', { cause: error })
    }
  }
  read() { return this.run(false, (repository) => repository.read()) }
  save(value: TableColumnPolicy) {
    const input = tableColumnPolicySchema.parse(value), table = tableColumnCatalog.find((item) => item.key === input.key)
    if (!table || input.excluded.some((id) => !table.columns.some((column) => column.id === id && !column.required))) return Promise.reject(new Error('Les colonnes obligatoires doivent rester proposées.'))
    return this.run(true, (repository) => repository.save(input))
  }
}
export const tableColumnPoliciesService = new TableColumnPoliciesService(environment.pocketBaseUrl ? createTableColumnPoliciesRepository(environment.pocketBaseUrl) : undefined, (write) => { const session = sessionService.getSnapshot(); return session.status === 'authenticated' && (!write || ['admin', 'superuser'].includes(session.user.erpProfile || '') && hasPermission(session.user, 'settings.references')) })
