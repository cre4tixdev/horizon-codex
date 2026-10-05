import { z } from 'zod'
import { createPocketBaseClient } from '../../../core/pocketbase/client'
import { referenceSchema } from '../schemas/references'
import type { CatalogName, ReferenceInput } from '../types/references'
export function createReferencesRepository(url: string) {
  const client = createPocketBaseClient(url)
  return {
    async list(catalog: CatalogName) { return z.array(referenceSchema).parse(await client.collection(catalog).getFullList({ sort: 'sort_order,label', requestKey: null })) },
    async save(catalog: CatalogName, input: ReferenceInput, id?: string) { return referenceSchema.parse(id ? await client.collection(catalog).update(id, input) : await client.collection(catalog).create(input)) },
  }
}
