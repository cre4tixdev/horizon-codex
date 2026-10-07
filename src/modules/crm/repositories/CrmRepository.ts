import { z } from 'zod'
import { createPocketBaseClient } from '../../../core/pocketbase/client'
import { opportunitiesPageSchema, opportunitySchema, stageSchema, ownerSchema, type CrmListOptions, type OpportunityInput, type StageChange } from '../schemas/opportunities'
export function createCrmRepository(url: string) {
  const client = createPocketBaseClient(url)
  const expand = 'company,contact,owner,stage'
  return {
    async list(options: CrmListOptions) {
      const filters = [client.filter('active = {:active}', { active: !options.archived })]
      if (options.status && ['open', 'won', 'completed', 'lost', 'cancelled'].includes(options.status)) filters.push(client.filter('status = {:status}', { status: options.status }))
      for (const key of ['company', 'owner'] as const) if (options[key]) filters.push(client.filter(`${key} = {:id}`, { id: options[key] }))
      for (const term of options.search.trim().split(/\s+/).filter(Boolean)) filters.push(client.filter('(title ~ {:q} || opportunity_number ~ {:q} || company.name ~ {:q})', { q: term }))
      const sort = ['created', '-created', 'title', '-title', 'expected_date', '-expected_date', 'estimated_value', '-estimated_value', 'opportunity_number', '-opportunity_number'].includes(options.sort) ? options.sort : '-created'
      return opportunitiesPageSchema.parse(await client.collection('crm_opportunities').getList(options.page, 100, { filter: filters.join(' && '), sort: `${sort},id`, expand, requestKey: null }))
    },
    async summary(options: CrmListOptions) { return z.object({ items: z.array(z.object({ stage: z.string(), currency: z.string(), count: z.number(), amount: z.number() })) }).parse(await client.send('/api/horizon/crm/summary', { method: 'GET', query: { q: options.search, state: options.archived ? 'archived' : 'active', status: options.status, company: options.company, owner: options.owner }, requestKey: null })).items },
    async record(id: string) { return opportunitySchema.parse(await client.collection('crm_opportunities').getOne(id, { expand, requestKey: null })) },
    async stages() { return z.array(stageSchema).parse(await client.collection('crm_stages').getFullList({ sort: 'sort_order,label', requestKey: null })) },
    async owners() { return z.object({ items: z.array(ownerSchema) }).parse(await client.send('/api/horizon/crm/owners', { method: 'GET', requestKey: null })).items },
    async save(input: OpportunityInput, creationKey: string, record?: { id: string; updated: string }) { return opportunitySchema.parse(await client.send('/api/horizon/crm/save', { method: 'POST', body: { input, creation_key: creationKey, ...record }, requestKey: null })) },
    async move(changes: StageChange[]) { await client.send('/api/horizon/crm/stages', { method: 'POST', body: { changes }, requestKey: null }) },
    async archive(id: string, active: boolean) { await client.send('/api/horizon/crm/archive', { method: 'POST', body: { id, active }, requestKey: null }) },
    async remove(id: string) { await client.send('/api/horizon/crm/delete', { method: 'POST', body: { id }, requestKey: null }) },
  }
}
export type CrmRepository = ReturnType<typeof createCrmRepository>
