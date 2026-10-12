import { z } from 'zod'
import { createPocketBaseClient } from '../../../core/pocketbase/client'
import { operationSchema, operationsPageSchema, operationChoicesSchema, operationSourceSchema, stockSettingsSchema, type OperationSourceQuery, type OperationsQuery, type OperationInput, type StockSettings } from '../schemas/operations'
export function createOperationsRepository(url: string) {
  const client = createPocketBaseClient(url), base = '/api/horizon/inventory/operations'
  return {
    async list(query: OperationsQuery) { return operationsPageSchema.parse(await client.send(base, { method: 'GET', query, requestKey: null })) },
    async record(id: string) { return operationSchema.parse(await client.send(`${base}/${id}`, { method: 'GET', requestKey: null })) },
    async choices() { return operationChoicesSchema.parse(await client.send(`${base}/choices`, { method: 'GET', requestKey: null })) },
    async source(query: OperationSourceQuery) { return operationSourceSchema.parse(await client.send(`${base}/source`, { method: 'GET', query, requestKey: null })) },
    async product(id: string) { return z.object({ tracking: z.enum(['none', 'lot', 'serial']).default('none'), purpose: z.enum(['stock', 'consumption', 'internal', 'asset']).default('stock'), traces: z.array(z.object({ lot: z.string(), serial: z.string(), number: z.string(), quantity: z.number(), expiry_date: z.string() })).default([]), id: z.string(), description: z.string(), brand: z.string(), reference: z.string(), unit: z.string(), unit_cost: z.number().nullable() }).parse(await client.send(`${base}/product/${id}`, { method: 'GET', requestKey: null })) },
    async save(input: OperationInput, creation_key: string, id?: string, updated?: string) { return operationSchema.parse(await client.send(`${base}/save`, { method: 'POST', body: { input, creation_key, ...(id ? { id, updated } : {}) }, requestKey: null })) },
    async transition(id: string, updated: string, action: string) { return operationSchema.parse(await client.send(`${base}/transition`, { method: 'POST', body: { id, updated, action }, requestKey: null })) },
    async settings() { return stockSettingsSchema.parse(await client.send('/api/horizon/inventory/settings', { method: 'GET', requestKey: null })) },
    async saveSettings(input: StockSettings) { return stockSettingsSchema.parse(await client.send('/api/horizon/inventory/settings', { method: 'POST', body: input, requestKey: null })) },
  }
}
