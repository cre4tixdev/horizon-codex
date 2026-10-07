import { createPocketBaseClient } from '../../../core/pocketbase/client'
import { crmSettingsSchema, type CrmSettings } from '../schemas/crmSettings'
export function createCrmSettingsRepository(url: string) {
  const client = createPocketBaseClient(url)
  return {
    async read() { return crmSettingsSchema.parse(await client.collection('settings_crm').getFirstListItem('code = "crm"', { requestKey: null })) },
    async save(id: string, view: CrmSettings['default_view']) { return crmSettingsSchema.parse(await client.collection('settings_crm').update(id, { default_view: view })) },
  }
}
