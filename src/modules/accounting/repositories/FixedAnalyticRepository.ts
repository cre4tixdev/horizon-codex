import { createPocketBaseClient } from '../../../core/pocketbase/client'
import { fixedAnalyticPageSchema, type FixedAnalyticInput } from '../schemas/fixedAnalytic'
export function createFixedAnalyticRepository(url: string) {
  const client = createPocketBaseClient(url), base = '/api/horizon/accounting/fixed-accounts'
  return {
    async read() { return fixedAnalyticPageSchema.parse(await client.send(base, { method: 'GET', requestKey: null })) },
    async save(items: FixedAnalyticInput[]) { return fixedAnalyticPageSchema.parse(await client.send(base, { method: 'POST', body: { items }, requestKey: null })) },
  }
}
