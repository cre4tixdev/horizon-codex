import { ClientResponseError } from 'pocketbase'
import { createPocketBaseClient } from '../../../core/pocketbase/client'
import { accountSchema, overviewSchema, choicesSchema, identitySchema, listSchema, settingsSchema, sheetSchema, type TimeInput, type TimeSheet } from '../schemas/time'
export function createTimeRepository(url: string) {
  const client = createPocketBaseClient(url), base = '/api/horizon/time'
  const get = (path: string, query: Record<string, string> = {}) => client.send(base + path, { method: 'GET', query, requestKey: null })
  const post = (path: string, body: object) => client.send(base + path, { method: 'POST', body, requestKey: null })
  return {
    async photo(id: string) {
      const response = await fetch(client.buildURL(`${base}/employees/${id}/photo`), { headers: { Authorization: client.authStore.token }, cache: 'no-store' })
      if (!response.ok) throw new ClientResponseError({ status: response.status })
      return response.status === 204 ? null : response.blob()
    },
    async overview(query: Record<string, string>) { return overviewSchema.parse(await get('/overview', query)) },
    async choices() { return choicesSchema.parse(await get('/choices')) },
    async week(date: string) { return sheetSchema.parse(await get('/week', { date })) },
    async record(id: string) { return sheetSchema.parse(await get(`/sheets/${id}`)) },
    async list(query: Record<string, string>) { return listSchema.parse(await get('/sheets', query)) },
    async save(input: TimeInput) { return sheetSchema.parse(await post('/week', input)) },
    async transition(sheet: TimeSheet, action: string, manager: string, reason: string) { return sheetSchema.parse(await post(`/sheets/${sheet.id}/transition`, { revision: sheet.revision, action, manager, reason })) },
    async accounts(q: string) { return accountSchema.array().parse(await get('/accounts', { q })) },
    async sold(account: string, product: string) { return identitySchema.array().parse(await get('/sold-services', { account, product })) },
    async favorite(input: object) { return choicesSchema.parse(await post('/favorites', input)) },
    async settings(q = '') { return settingsSchema.parse(await get('/settings', { q })) },
    async saveSettings(area: 'activities' | 'resources', input: object) { return settingsSchema.parse(await post('/settings', { area, input })) },
  }
}
