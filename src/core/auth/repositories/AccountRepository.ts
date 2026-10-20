import { displayPreferenceRecordSchema, type DisplayPreferenceRecord } from '../../preferences/displayPreferences'
import { ClientResponseError } from 'pocketbase'
import { createPocketBaseClient } from '../../pocketbase/client'
import { accountSchema, type AccountInput, type PasswordInput, type Presence } from '../schemas/account'
export function createAccountRepository(url: string) {
  const client = createPocketBaseClient(url)
  return {
    async displayPreferences() { return displayPreferenceRecordSchema.parse(await client.send('/api/horizon/account/display-preferences', { method: 'GET', requestKey: null })) },
    async saveDisplayPreferences(input: DisplayPreferenceRecord) { return displayPreferenceRecordSchema.parse(await client.send('/api/horizon/account/display-preferences', { method: 'POST', body: input, requestKey: null })) },
    async read() { return accountSchema.parse(await client.send('/api/horizon/account', { method: 'GET', requestKey: null })) },
    async save(input: AccountInput, updated: string) {
      const body = new FormData(); body.set('input', JSON.stringify(input)); body.set('updated', updated)
      return accountSchema.parse(await client.send('/api/horizon/account/save', { method: 'POST', body, requestKey: null }))
    },
    async presence(presence: Presence) { return accountSchema.parse(await client.send('/api/horizon/account/presence', { method: 'POST', body: { presence }, requestKey: null })) },
    async password(body: PasswordInput) { await client.send('/api/horizon/account/password', { method: 'POST', body, requestKey: null }) },
    async avatar(id: string) {
      const response = await fetch(client.buildURL(`/api/horizon/account/avatar/${encodeURIComponent(id)}`), { headers: { Authorization: client.authStore.token }, cache: 'no-store' })
      if (!response.ok) throw new ClientResponseError({ status: response.status })
      return response.status === 204 ? null : response.blob()
    },
  }
}
