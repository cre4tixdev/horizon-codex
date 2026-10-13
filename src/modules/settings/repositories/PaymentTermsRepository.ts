import { createPocketBaseClient } from '../../../core/pocketbase/client'
import { paymentTermsSchema } from '../schemas/paymentTerms'
export function createPaymentTermsRepository(url: string) {
  const client = createPocketBaseClient(url)
  return { async list() { return paymentTermsSchema.parse(await client.send('/api/horizon/settings/payment-terms', { requestKey: null })) } }
}
