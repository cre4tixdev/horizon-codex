import { createPocketBaseClient } from '../../../core/pocketbase/client'
import { analysisSchema, analysisPageSchema } from '../schemas/analysis'
export function createAnalysisRepository(url: string) {
  const client = createPocketBaseClient(url)
  return { async list(query: Record<string, string>) { return analysisPageSchema.parse(await client.send('/api/horizon/analysis/affairs', { method: 'GET', query, requestKey: null })) }, async read(source: { opportunity: string } | { quote: string }) { return analysisSchema.parse(await client.send('/api/horizon/analysis/report', { method: 'GET', query: source, requestKey: null })) } }
}
