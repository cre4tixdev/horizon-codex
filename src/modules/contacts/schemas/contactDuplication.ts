import { companyInputSchema, personInputSchema } from './contacts'
import type { Company, Person } from '../types/contacts'

// A duplicate is a new draft: never reuse a record ID, file name or legal ID.
export function companyDuplicate(source: Company) {
  return companyInputSchema.parse({ ...source, name: `${source.name.slice(0, 152)} (copie)`, siren: '', siret: '', vat_number: '', lei: '', billing_email: '', einvoice_routing_address: '', einvoice_platform: '', einvoice_service_code: '', einvoice_status: 'unknown' })
}
export function personDuplicate(source: Person) {
  return personInputSchema.parse({ ...source, last_name: `${source.last_name.slice(0, 72)} (copie)` })
}
