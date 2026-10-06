import { z } from 'zod'
import { createPocketBaseClient } from '../pocketbase/client'
import { savedViewSchema, type SavedViewInput, type ViewContext } from './types'

export function createViewsRepository(url: string) {
  const client = createPocketBaseClient(url)
  return {
    async list(context: ViewContext) { return z.array(savedViewSchema).parse(await client.collection('core_saved_views').getFullList({ filter: client.filter('context = {:context}', { context }), sort: 'visibility,name,id', requestKey: null })) },
    async save(input: SavedViewInput, id?: string) { return savedViewSchema.parse(id ? await client.collection('core_saved_views').update(id, input) : await client.collection('core_saved_views').create(input)) },
    async remove(id: string) { await client.collection('core_saved_views').delete(id) },
  }
}
