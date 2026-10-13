import { z } from 'zod'
import { createPocketBaseClient } from '../../../core/pocketbase/client'
import { operationSchema, operationsPageSchema, operationChoicesSchema, operationSourceSchema, stockSettingsSchema, deliveryReadinessSchema, type OperationSourceQuery, type OperationsQuery, type OperationInput, type StockSettings, type DeliveryQuantity, type DeliveryMatch } from '../schemas/operations'
export function createOperationsRepository(url: string) {
  const client = createPocketBaseClient(url), base = '/api/horizon/inventory/operations'
  return {
    async list(query: OperationsQuery) { return operationsPageSchema.parse(await client.send(base, { method: 'GET', query, requestKey: null })) },
    async readiness(id: string) { return deliveryReadinessSchema.nullable().parse(await client.send(`${base}/readiness/${id}`, { method: 'GET', requestKey: null })) },
    async record(id: string) { return operationSchema.parse(await client.send(`${base}/${id}`, { method: 'GET', requestKey: null })) },
    async choices() { return operationChoicesSchema.parse(await client.send(`${base}/choices`, { method: 'GET', requestKey: null })) },
    async source(query: OperationSourceQuery) { return operationSourceSchema.parse(await client.send(`${base}/source`, { method: 'GET', query, requestKey: null })) },
    async product(id: string) { return z.object({ tracking: z.enum(['none', 'lot', 'serial']).default('none'), purpose: z.enum(['stock', 'consumption', 'internal', 'asset']).default('stock'), traces: z.array(z.object({ lot: z.string(), serial: z.string(), number: z.string(), quantity: z.number(), expiry_date: z.string() })).default([]), id: z.string(), description: z.string(), brand: z.string(), reference: z.string(), unit: z.string(), unit_cost: z.number().nullable() }).parse(await client.send(`${base}/product/${id}`, { method: 'GET', requestKey: null })) },
    async save(input: OperationInput, creation_key: string, id?: string, updated?: string) { return operationSchema.parse(await client.send(`${base}/save`, { method: 'POST', body: { input, creation_key, ...(id ? { id, updated } : {}) }, requestKey: null })) },
    async transition(id: string, updated: string, action: string, quantities?: DeliveryQuantity[]) { return operationSchema.parse(await client.send(`${base}/transition`, { method: 'POST', body: { id, updated, action, ...(quantities ? { quantities } : {}) }, requestKey: null })) },
    async deliveryNeeded(quote: string) { return z.object({ needed: z.boolean() }).parse(await client.send(`${base}/delivery-needed/${quote}`, { requestKey: null })).needed },
    async prepareDelivery(sales_quote: string, warehouse = '') { return operationSchema.parse(await client.send(`${base}/prepare-delivery`, { method: 'POST', body: { sales_quote, warehouse }, requestKey: null })) },
    async prepareReceiptDeliveries(id: string, updated: string, matches: DeliveryMatch[]) { return operationSchema.parse(await client.send(`${base}/prepare-receipt-deliveries`, { method: 'POST', body: { id, updated, matches }, requestKey: null })) },
    async settings() { return stockSettingsSchema.parse(await client.send('/api/horizon/inventory/settings', { method: 'GET', requestKey: null })) },
    async saveSettings(input: StockSettings) { return stockSettingsSchema.parse(await client.send('/api/horizon/inventory/settings', { method: 'POST', body: input, requestKey: null })) },
  }
}
