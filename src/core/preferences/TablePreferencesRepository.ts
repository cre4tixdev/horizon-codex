import { createPocketBaseClient } from '../pocketbase/client'
import { tablePreferenceRecordSchema, type TablePreferenceRecord } from './tablePreferences'
export function createTablePreferencesRepository(url: string) {
  const client = createPocketBaseClient(url)
  const path = (context: string) => `/api/horizon/table-preferences/${encodeURIComponent(context)}`
  return {
    async read(context: string) { return tablePreferenceRecordSchema.parse(await client.send(path(context), { method: 'GET', requestKey: null })) },
    async save(context: string, input: TablePreferenceRecord) { return tablePreferenceRecordSchema.parse(await client.send(path(context), { method: 'POST', body: input, requestKey: null })) },
  }
}
