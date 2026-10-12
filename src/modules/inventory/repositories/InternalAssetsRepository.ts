import { createPocketBaseClient } from '../../../core/pocketbase/client'
import { internalAssetSchema, internalAssetsPageSchema, type AssetQuery, type InternalAssetInput } from '../schemas/internalAssets'
export function createInternalAssetsRepository(url: string) {
  const client = createPocketBaseClient(url), base = '/api/horizon/inventory/assets'
  return {
    async list(query: AssetQuery) { return internalAssetsPageSchema.parse(await client.send(base, { method: 'GET', query, requestKey: null })) },
    async record(id: string) { return internalAssetSchema.parse(await client.send(`${base}/${id}`, { method: 'GET', requestKey: null })) },
    async save(id: string, updated: string, input: InternalAssetInput, action: 'save' | 'return_stock') { return internalAssetSchema.parse(await client.send(`${base}/save`, { method: 'POST', body: { id, updated, input, action }, requestKey: null })) },
  }
}
