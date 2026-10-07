import { createPocketBaseClient } from '../../pocketbase/client'
import { accessDirectorySchema, accessUserSchema, type AccessInput, type AccessUser } from '../schemas/access'
export function createAccessRepository(url: string) {
  const client = createPocketBaseClient(url)
  return {
    async list() { return accessDirectorySchema.parse(await client.send('/api/horizon/access/users', { method: 'GET', requestKey: null })) },
    async save(input: AccessInput, record?: AccessUser) { return accessUserSchema.parse(await client.send('/api/horizon/access/users/save', { method: 'POST', body: { id: record?.id || '', updated: record?.updated || '', input } })) },
  }
}
