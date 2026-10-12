import { createPocketBaseClient } from '../../pocketbase/client'
import { accountSchema, type AccountInput, type PasswordInput, type Presence } from '../schemas/account'
export function createAccountRepository(url: string) {
  const client = createPocketBaseClient(url)
  return {
    async read() { return accountSchema.parse(await client.send('/api/horizon/account', { method: 'GET', requestKey: null })) },
    async save(input: AccountInput, updated: string, avatar: File | undefined, removeAvatar: boolean) {
      const body = new FormData(); body.set('input', JSON.stringify(input)); body.set('updated', updated); body.set('remove_avatar', String(removeAvatar)); if (avatar) body.set('avatar', avatar)
      return accountSchema.parse(await client.send('/api/horizon/account/save', { method: 'POST', body, requestKey: null }))
    },
    async presence(presence: Presence) { return accountSchema.parse(await client.send('/api/horizon/account/presence', { method: 'POST', body: { presence }, requestKey: null })) },
    async password(body: PasswordInput) { await client.send('/api/horizon/account/password', { method: 'POST', body, requestKey: null }) },
    async avatarURL(record: { id: string; avatar: string }) { const token = await client.files.getToken({ requestKey: null }); return client.files.getURL({ id: record.id, collectionName: 'core_users' }, record.avatar, { token }) },
  }
}
