import { accountDraftSchema, type AccountDraft } from '../schemas/thirdPartyAccounts'
import type { createThirdPartyAccountsRepository } from '../repositories/ThirdPartyAccountsRepository'
export class ThirdPartyAccountsService {
  constructor(private readonly repository: ReturnType<typeof createThirdPartyAccountsRepository>, private readonly allowed: (permission: string) => boolean) {}
  private authorize(write = false) {
    if (!this.allowed('contacts.read') || (write && !this.allowed('contacts.write'))) throw new Error('Vous ne disposez pas des permissions nécessaires.')
  }
  list(company: string) { this.authorize(); return this.repository.list(company) }
  save(company: string, draft: AccountDraft, operation?: string) { this.authorize(true); return this.repository.save(company, accountDraftSchema.parse(draft), operation) }
}
