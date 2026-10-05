import { createCompanyLookupRepository } from '../repositories/CompanyLookupRepository'

// Public API: browser reads only. The Contacts save workflow handles persistence.
const repository = createCompanyLookupRepository()
export const companyLookupService = {
  search: (query: string) => repository.search(query),
  preview: (identifier: string) => repository.preview(identifier),
}
