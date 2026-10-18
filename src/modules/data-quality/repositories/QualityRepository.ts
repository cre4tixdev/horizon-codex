import { createPocketBaseClient } from '../../../core/pocketbase/client'
import { candidatesSchema } from '../schemas/quality'
export function createQualityRepository(url: string) {
  const client = createPocketBaseClient(url)
  return { async list(query: Record<string, string | number>) { return candidatesSchema.parse(await client.send('/api/horizon/data-quality/candidates', { method: 'GET', query, requestKey: null })) } }
}
