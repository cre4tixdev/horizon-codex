import { z } from 'zod'
import { createPocketBaseClient } from '../../../core/pocketbase/client'
import { stockChoicesSchema, stockPageSchema, productReservationsSchema, reservationChoicesSchema, balanceSchema, type StockSelection, type StockQuery, type StockAdjustment } from '../schemas/stock'
export function createStockRepository(url: string) {
  const client = createPocketBaseClient(url)
  return {
    async productReservations(id: string) { return productReservationsSchema.parse(await client.send(`/api/horizon/inventory/stock/products/${id}/reservations`, { method: 'GET', requestKey: null })) },
    async list(query: StockQuery) { return stockPageSchema.parse(await client.send('/api/horizon/inventory/stock', { method: 'GET', query, requestKey: null })) },
    async choices() { return stockChoicesSchema.parse(await client.send('/api/horizon/inventory/stock/choices', { method: 'GET', requestKey: null })) },
    async adjust(body: StockAdjustment) { return balanceSchema.parse(await client.send('/api/horizon/inventory/stock/adjust', { method: 'POST', body, requestKey: null })) },
    async reservations(id: string) { return reservationChoicesSchema.parse(await client.send('/api/horizon/inventory/stock/reservations/' + id, { method: 'GET', requestKey: null })) },
    async reserve(quote: string, revision: string, selections: StockSelection[]) { return z.object({ saved: z.literal(true) }).parse(await client.send('/api/horizon/inventory/stock/reservations', { method: 'POST', body: { quote, revision, selections }, requestKey: null })) },
    async createLocation(warehouse: string, code: string, name: string) { return z.object({ saved: z.literal(true) }).parse(await client.send('/api/horizon/inventory/stock/locations', { method: 'POST', body: { warehouse, code, name }, requestKey: null })) },
  }
}
