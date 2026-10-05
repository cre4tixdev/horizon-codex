import { z } from 'zod'
import { createPocketBaseClient } from '../../../core/pocketbase/client'
import { thirdPartyAccountSchema, type AccountDraft } from '../schemas/thirdPartyAccounts'
export function createThirdPartyAccountsRepository(url: string) {
  const client = createPocketBaseClient(url)
  async function list(company: string) { return z.array(thirdPartyAccountSchema).parse(await client.collection('accounting_third_party_accounts').getFullList({ filter: client.filter('company = {:company}', { company }), requestKey: null })) }
  return {
    list,
    async save(company: string, draft: AccountDraft, operation?: string) {
      const options = { headers: operation ? { 'X-Horizon-Operation': operation } : {} }
      const existing = await list(company)
      for (const type of ['customer', 'supplier'] as const) {
        const code = draft[type === 'customer' ? 'customer_account' : 'supplier_account']
        const current = existing.find((item) => item.type === type)
        if (!current && !code) continue
        if (current && current.account_code === code && current.active === Boolean(code)) continue
        const data = { company, type, account_code: code, active: Boolean(code) }
        if (current) await client.collection('accounting_third_party_accounts').update(current.id, data, options)
        else await client.collection('accounting_third_party_accounts').create(data, options)
      }
    },
  }
}
