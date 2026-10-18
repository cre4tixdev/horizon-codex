import { createPocketBaseClient } from '../pocketbase/client'
import { tableColumnPoliciesSchema, tableColumnPolicySchema, type TableColumnPolicy } from './tableColumnPolicies'
export function createTableColumnPoliciesRepository(url: string) {
  const client = createPocketBaseClient(url), path = '/api/horizon/table-column-policies'
  return {
    async read() { return tableColumnPoliciesSchema.parse(await client.send(path, { method: 'GET', requestKey: null })) },
    async save(input: TableColumnPolicy) { return tableColumnPolicySchema.parse(await client.send(`${path}/${encodeURIComponent(input.key)}`, { method: 'POST', body: { revision: input.revision, excluded: input.excluded }, requestKey: null })) },
  }
}
