import { z } from 'zod'
import { createPocketBaseClient } from '../../../core/pocketbase/client'
import { valuationPageSchema, valuationHistorySchema, type ValuationCostInput, type ValuationMethodInput } from '../schemas/valuation'
export function createValuationRepository(url: string) {
  const client = createPocketBaseClient(url), base = '/api/horizon/inventory/valuation', saved = z.object({ saved: z.literal(true) })
  return {
    async list(query: { q?: string; product?: string; page?: number }) { return valuationPageSchema.parse(await client.send(base, { method: 'GET', query, requestKey: null })) },
    async history(product: string) { return valuationHistorySchema.parse(await client.send(`${base}/history`, { method: 'GET', query: { product }, requestKey: null })) },
    async cost(body: ValuationCostInput) { return saved.parse(await client.send(`${base}/cost`, { method: 'POST', body, requestKey: null })) },
    async method(body: ValuationMethodInput) { return saved.parse(await client.send(`${base}/method`, { method: 'POST', body, requestKey: null })) },
  }
}
