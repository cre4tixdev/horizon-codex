import { z } from 'zod'
import { traceChoicesSchema } from '../schemas/traces'
import { createPocketBaseClient } from '../../../core/pocketbase/client'
const historySchema = z.object({ page: z.number(), totalItems: z.number(), totalPages: z.number(), items: z.array(z.object({ id: z.string(), date: z.string(), operation: z.string(), number: z.string(), kind: z.string(), quantity: z.number(), location: z.string(), actor: z.string() })) })
export function createTraceRepository(url: string) {
  const client = createPocketBaseClient(url), base = '/api/horizon/inventory/traces'
  return {
    async choices(product: string, location = '') { return traceChoicesSchema.parse(await client.send(base, { method: 'GET', query: { product, location }, requestKey: null })) },
    async history(product: string, lot: string, serial: string, page: number) { return historySchema.parse(await client.send(`${base}/history`, { method: 'GET', query: { product, lot, serial, page }, requestKey: null })) },
    async lot(id: string, updated: string, status: string, expiry_date: string) { await client.send(`${base}/lot`, { method: 'POST', body: { id, updated, status, expiry_date }, requestKey: null }) },
  }
}
