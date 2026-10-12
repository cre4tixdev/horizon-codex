import { createPocketBaseClient } from '../../../core/pocketbase/client'
import { fixedAssetSchema, fixedAssetsPageSchema, type FixedAssetInput } from '../schemas/fixedAssets'
export function createFixedAssetsRepository(url: string) {
  const client = createPocketBaseClient(url), base = '/api/horizon/accounting/assets'
  return {
    async list(query: { q: string; status: string; page: number; sort?: string }) { return fixedAssetsPageSchema.parse(await client.send(base, { method: 'GET', query, requestKey: null })) },
    async record(id: string) { return fixedAssetSchema.parse(await client.send(`${base}/${id}`, { method: 'GET', requestKey: null })) },
    async save(id: string, updated: string, input: FixedAssetInput, action: 'save' | 'register' | 'dispose') { return fixedAssetSchema.parse(await client.send(`${base}/save`, { method: 'POST', body: { id, updated, input, action }, requestKey: null })) },
  }
}
