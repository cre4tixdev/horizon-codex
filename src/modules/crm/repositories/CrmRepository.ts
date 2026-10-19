import type { TenderInput } from '../schemas/tenders'
import { z } from 'zod'
import { createPocketBaseClient } from '../../../core/pocketbase/client'
import { opportunitiesPageSchema, opportunitySchema, stageSchema, ownerSchema, type CrmListOptions, type OpportunityInput, type StageChange } from '../schemas/opportunities'
export function createCrmRepository(url: string) {
  const client = createPocketBaseClient(url)
  const expand = 'company,contact,owner,stage,crm_tenders_via_opportunity'
  return {
    async list(options: CrmListOptions) {
      const filters = [client.filter('active = {:active}', { active: !options.archived })]
      if (options.type === 'direct' || options.type === 'tender') filters.push(client.filter('type = {:type}', { type: options.type }))
      if (options.preparationStatus || options.tag) filters.push('type = "tender" && crm_tenders_via_opportunity.archived_at = ""')
      if (options.preparationStatus) filters.push(client.filter('crm_tenders_via_opportunity.status.id = {:id}', { id: options.preparationStatus }))
      if (options.tag) filters.push(client.filter('crm_tenders_via_opportunity.tags.id ?= {:id}', { id: options.tag }))
      if (options.status && ['open', 'won', 'completed', 'lost', 'cancelled'].includes(options.status)) filters.push(client.filter('status = {:status}', { status: options.status }))
      for (const key of ['company', 'owner'] as const) if (options[key]) filters.push(client.filter(`${key} = {:id}`, { id: options[key] }))
      for (const term of options.search.trim().split(/\s+/).filter(Boolean)) filters.push(client.filter(`(title ~ {:q} || opportunity_number ~ {:q} || company.name ~ {:q}${options.type === 'tender' ? ' || crm_tenders_via_opportunity.reference ~ {:q}' : ''})`, { q: term }))
      if (options.company || ['type', 'company', 'stage', 'market_types', 'owner'].includes(options.sort.replace(/^-/, ''))) {
        const metadata = z.object({ items: z.array(z.object({ id: z.string() })), totalItems: z.number(), totalPages: z.number(), page: z.number() }).parse(await client.send('/api/horizon/crm/list-index', { method: 'GET', requestKey: null, query: { q: options.search, state: options.archived ? 'archived' : 'active', status: options.status, company: options.company, owner: options.owner, type: options.type || '', preparation: options.preparation ? 'true' : '', preparation_status: options.preparationStatus || '', tag: options.tag || '', sort: options.sort, page: options.page, perPage: options.perPage || 100 } }))
        const records = metadata.items.length ? (await client.collection('crm_opportunities').getList(1, 100, { filter: metadata.items.map((item) => client.filter('id = {:id}', { id: item.id })).join(' || '), expand, requestKey: null })).items : []
        return opportunitiesPageSchema.parse({ ...metadata, items: metadata.items.flatMap((item) => records.filter((record) => record.id === item.id)) })
      }
      const sort = ['created', '-created', 'title', '-title', 'expected_date', '-expected_date', 'estimated_value', '-estimated_value', 'opportunity_number', '-opportunity_number', 'probability', '-probability'].includes(options.sort) ? options.sort : '-created'
      return opportunitiesPageSchema.parse(await client.collection('crm_opportunities').getList(options.page, options.perPage || 100, { filter: filters.join(' && '), sort: `${sort},id`, expand, requestKey: null }))
    },
    async summary(options: CrmListOptions) { return z.object({ items: z.array(z.object({ stage: z.string(), currency: z.string(), count: z.number(), amount: z.number() })) }).parse(await client.send('/api/horizon/crm/summary', { method: 'GET', query: { q: options.search, state: options.archived ? 'archived' : 'active', status: options.status, company: options.company, owner: options.owner, type: options.type || '', preparation: options.preparation ? 'true' : '', preparation_status: options.preparationStatus || '', tag: options.tag || '' }, requestKey: null })).items },
    async record(id: string) { return opportunitySchema.parse(await client.collection('crm_opportunities').getOne(id, { expand, requestKey: null })) },
    async stages() { return z.array(stageSchema).parse(await client.collection('crm_stages').getFullList({ sort: 'sort_order,label', requestKey: null })) },
    async owners() { return z.object({ items: z.array(ownerSchema) }).parse(await client.send('/api/horizon/crm/owners', { method: 'GET', requestKey: null })).items },
    async save(input: OpportunityInput, creationKey: string, record?: { id: string; updated: string }, tender?: TenderInput, tenderUpdated?: string) { return opportunitySchema.parse(await client.send('/api/horizon/crm/save', { method: 'POST', body: { input, creation_key: creationKey, ...record, ...(tender ? { tender } : {}), ...(tenderUpdated ? { tender_updated: tenderUpdated } : {}) }, requestKey: null })) },
    async move(changes: StageChange[]) { await client.send('/api/horizon/crm/stages', { method: 'POST', body: { changes }, requestKey: null }) },
    async archive(id: string, active: boolean) { await client.send('/api/horizon/crm/archive', { method: 'POST', body: { id, active }, requestKey: null }) },
    async remove(id: string) { await client.send('/api/horizon/crm/delete', { method: 'POST', body: { id }, requestKey: null }) },
  }
}
export type CrmRepository = ReturnType<typeof createCrmRepository>
