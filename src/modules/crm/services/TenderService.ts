import { opportunityInputSchema, type OpportunityInput, type CrmListOptions } from '../schemas/opportunities'
import { tenderInputSchema, type TenderInput } from '../schemas/tenders'
import { ClientResponseError } from 'pocketbase'
import { environment } from '../../../core/config/environment'
import { sessionService } from '../../../core/auth/services/session'
import { hasPermission } from '../../../core/auth/types/session'
import { createTenderRepository, type TenderRepository } from '../repositories/TenderRepository'
import { appointmentInputSchema, submissionInputSchema, type AppointmentInput, type SubmissionInput } from '../schemas/tenders'
export class TenderService {
  constructor(private readonly repository: TenderRepository | undefined, private readonly allowed: (permission: string) => boolean) {}
  private async run<T>(write: boolean, action: (repository: TenderRepository) => Promise<T>) {
    if (!this.allowed('crm.read') || write && !this.allowed('crm.write')) throw new Error('Vous ne disposez pas des permissions AO nécessaires.')
    if (!this.repository) throw new Error('Le volet AO n’est pas configuré.')
    try { return await action(this.repository) } catch (error) {
      console.error('[crm-tenders] Operation failed', { status: error instanceof ClientResponseError ? error.status : 0 })
      if (error instanceof ClientResponseError && [400, 409].includes(error.status)) throw new Error(error.response.message || 'Vérifiez les données du dossier AO.', { cause: error })
      throw new Error('Dossier AO indisponible ou accès refusé. Vérifiez l’installation du lot AO.', { cause: error })
    }
  }
  list(options: CrmListOptions) { return this.run(false, (repository) => repository.list(options)) }
  summary(options: CrmListOptions) { return this.run(false, (repository) => repository.summary(options)) }
  record(id: string) { return this.run(false, (repository) => repository.record(id)) }
  save(input: OpportunityInput, tender: TenderInput, key: string, record?: { id: string; updated: string; linked_updated: string }) { const parsed = opportunityInputSchema.parse(input); const dossier = tenderInputSchema.parse(tender); return this.run(true, (repository) => repository.save(parsed, dossier, key, record)) }
  archive(id: string, active: boolean, updated: string) { return this.run(true, (repository) => repository.archive(id, active, updated)) }
  watch(onChange: () => void) { return this.run(false, (repository) => repository.watch(onChange)) }
  appointments(id: string) { return this.run(false, (repository) => repository.appointments(id)) }
  submissions(id: string) { return this.run(false, (repository) => repository.submissions(id)) }
  saveAppointment(tender: string, input: AppointmentInput, record?: { id: string; updated: string }) { const parsed = appointmentInputSchema.parse(input); return this.run(true, (repository) => repository.saveAppointment(tender, parsed, record)) }
  move(tender: string, status: string, updated: string) { return this.run(true, (repository) => repository.move(tender, status, updated)) }
  submit(tender: string, input: SubmissionInput, key: string) { const parsed = submissionInputSchema.parse(input); return this.run(true, (repository) => repository.submit(tender, parsed, key)) }
}
export const tenderService = new TenderService(environment.pocketBaseUrl ? createTenderRepository(environment.pocketBaseUrl) : undefined, (permission) => { const session = sessionService.getSnapshot(); return session.status === 'authenticated' && hasPermission(session.user, permission) })
