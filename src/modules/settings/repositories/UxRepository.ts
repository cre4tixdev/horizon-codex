import { createPocketBaseClient } from '../../../core/pocketbase/client'
import { uxSettingsSchema, type UxInput } from '../schemas/ux'
export function createUxRepository(url: string) {
  const client = createPocketBaseClient(url)
  return {
    async read() { return uxSettingsSchema.parse(await client.send('/api/horizon/settings/ux', { requestKey: null })) },
    async save(updated: string, config: UxInput) { return uxSettingsSchema.parse(await client.send('/api/horizon/settings/ux', { method: 'POST', body: { updated, config } })) },
    watch(refresh: () => void) { return client.collection('settings_ux').subscribe('*', refresh) },
  }
}
