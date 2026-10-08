import { opportunitySchema, opportunitiesPageSchema, type CrmListOptions, type OpportunityInput } from '../schemas/opportunities'
import type { TenderInput } from '../schemas/tenders'
import { z } from 'zod'
import { createPocketBaseClient } from '../../../core/pocketbase/client'
import { appointmentSchema, submissionSchema, type AppointmentInput, type SubmissionInput } from '../schemas/tenders'
export function createTenderRepository(url: string) {
  const client = createPocketBaseClient(url)
  const query = (options: CrmListOptions) => ({ q: options.search, page: options.page, sort: options.sort, state: options.archived ? 'archived' : 'active', status: options.status, company: options.company, owner: options.owner, preparation_status: options.preparationStatus || '', tag: options.tag || '' })
  return {
    async list(options: CrmListOptions) { return opportunitiesPageSchema.parse(await client.send('/api/horizon/crm/tenders', { method: 'GET', query: query(options), requestKey: null })) },
    async summary(options: CrmListOptions) { return z.object({ items: z.array(z.object({ stage: z.string(), currency: z.string(), count: z.number(), amount: z.number() })) }).parse(await client.send('/api/horizon/crm/tenders/summary', { method: 'GET', query: query(options), requestKey: null })).items },
    async record(id: string) { return opportunitySchema.parse(await client.send(`/api/horizon/crm/tenders/${id}`, { method: 'GET', requestKey: null })) },
    async save(input: OpportunityInput, tender: TenderInput, creationKey: string, record?: { id: string; updated: string; linked_updated: string }) { return opportunitySchema.parse(await client.send('/api/horizon/crm/tenders/save', { method: 'POST', body: { input, tender, creation_key: creationKey, ...record }, requestKey: null })) },
    async archive(id: string, active: boolean, updated: string) { await client.send('/api/horizon/crm/tenders/archive', { method: 'POST', body: { id, active, updated }, requestKey: null }) },
    async watch(onChange: () => void) {
      const stops: (() => Promise<void>)[] = []
      try {
        for (const collection of ['crm_opportunities', 'crm_tenders', 'crm_tender_appointments', 'crm_tender_submissions', 'crm_tender_statuses', 'crm_tender_tags']) {
          stops.push(await client.collection(collection).subscribe('*', onChange))
        }
        return async () => { await Promise.all(stops.map((stop) => stop())) }
      } catch (error) { await Promise.all(stops.map((stop) => stop())); throw error }
    },
    async appointments(tender: string) { return z.array(appointmentSchema).parse(await client.collection('crm_tender_appointments').getFullList({ filter: client.filter('tender = {:tender}', { tender }), sort: 'start,id', requestKey: null })) },
    async submissions(tender: string) { return z.array(submissionSchema).parse(await client.collection('crm_tender_submissions').getFullList({ filter: client.filter('tender = {:tender}', { tender }), sort: '-version', requestKey: null })) },
    async saveAppointment(tender: string, input: AppointmentInput, record?: { id: string; updated: string }) { return appointmentSchema.parse(await client.send('/api/horizon/crm/tenders/appointments', { method: 'POST', body: { tender, input, ...record }, requestKey: null })) },
    async move(tender: string, status: string, updated: string) { await client.send('/api/horizon/crm/tenders/stage', { method: 'POST', body: { tender, status, updated }, requestKey: null }) },
    async submit(tender: string, input: SubmissionInput, creationKey: string) { return submissionSchema.parse(await client.send('/api/horizon/crm/tenders/submit', { method: 'POST', body: { tender, input, creation_key: creationKey }, requestKey: null })) },
  }
}
export type TenderRepository = ReturnType<typeof createTenderRepository>
