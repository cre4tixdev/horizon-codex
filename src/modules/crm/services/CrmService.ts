import { tenderInputSchema, type TenderInput } from '../schemas/tenders'
import { hasPermission } from '../../../core/auth/types/session'
import { ClientResponseError } from 'pocketbase'
import { environment } from '../../../core/config/environment'
import { sessionService } from '../../../core/auth/services/session'
import { createCrmRepository, type CrmRepository } from '../repositories/CrmRepository'
import { opportunityInputSchema, type CrmListOptions, type OpportunityInput, type StageChange } from '../schemas/opportunities'
export class CrmService {
  constructor(private readonly repository: CrmRepository | undefined, private readonly allowed: (permission: string) => boolean) {}
  private async run<T>(write: boolean, action: (repository: CrmRepository) => Promise<T>) {
    if (!this.allowed('crm.read') || write && !this.allowed('crm.write')) throw new Error('Vous ne disposez pas des permissions CRM nécessaires.')
    if (!this.repository) throw new Error('Le module CRM n’est pas configuré.')
    try { return await action(this.repository) } catch (error) {
      console.error('[crm] Operation failed', { status: error instanceof ClientResponseError ? error.status : 0 })
      if (error instanceof ClientResponseError) {
        if (error.status === 409 || error.status === 400) throw new Error(error.response.message || 'Vérifiez les champs et les références de l’opportunité.', { cause: error })
        if (error.status === 403) throw new Error('Cette action CRM n’est pas autorisée.', { cause: error })
        if (error.status === 404) throw new Error('Opportunité inaccessible ou migration CRM non installée.', { cause: error })
      }
      throw new Error('Le CRM est indisponible. Réessayez.', { cause: error })
    }
  }
  list(options: CrmListOptions) { return this.run(false, (repo) => repo.list(options)) }
  summary(options: CrmListOptions) { return this.run(false, (repo) => repo.summary(options)) }
  record(id: string) { return this.run(false, (repo) => repo.record(id)) }
  stages() { return this.run(false, (repo) => repo.stages()) }
  owners() { return this.run(false, (repo) => repo.owners()) }
  save(input: OpportunityInput, key: string, record?: { id: string; updated: string }, tender?: TenderInput, tenderUpdated?: string) { const parsed = opportunityInputSchema.parse(input); return this.run(true, (repo) => repo.save(parsed, key, record, tender ? tenderInputSchema.parse(tender) : undefined, tenderUpdated)) }
  move(changes: StageChange[]) { return this.run(true, (repo) => repo.move(changes)) }
  archive(id: string, active: boolean) { return this.run(true, (repo) => repo.archive(id, active)) }
  remove(id: string) { return this.run(true, (repo) => repo.remove(id)) }
}
export const crmService = new CrmService(environment.pocketBaseUrl ? createCrmRepository(environment.pocketBaseUrl) : undefined, (permission) => { const session = sessionService.getSnapshot(); return session.status === 'authenticated' && hasPermission(session.user, permission) })
