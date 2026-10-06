import { ClientResponseError } from 'pocketbase'
import { environment } from '../../../core/config/environment'
import { sessionService } from '../../../core/auth/services/session'
import { hasPermission } from '../../../core/auth/types/session'
import { createContactsRepository, ContactsUpgradeError, type ContactsRepository } from '../repositories/ContactsRepository'
import { addressInputSchema, companyInputSchema, personInputSchema, roleValues, roleSchema } from '../schemas/contacts'
import type { AddressChange, AddressInput, CompanyInput, ContactFiles, ContactKind, ListOptions, PersonInput, Company } from '../types/contacts'

import { ThirdPartyAccountsService } from '../../accounting/services/ThirdPartyAccountsService'
import { createThirdPartyAccountsRepository } from '../../accounting/repositories/ThirdPartyAccountsRepository'
import { accountDraftSchema, type AccountDraft } from '../../accounting/schemas/thirdPartyAccounts'

function fail(message: string): never { throw new Error(message) }

export class CompanyAddressSaveError extends Error {
  constructor(public readonly company: Company, cause: unknown) {
    super(`La société est enregistrée, mais son adresse ne l’est pas. ${cause instanceof Error ? cause.message : 'Réessayez.'}`, { cause })
  }
}

export class CompanyRolesSaveError extends Error {
  constructor(public readonly company: Company, cause: unknown) {
    super(`La société est enregistrée, mais ses relations commerciales ne le sont pas toutes. ${cause instanceof Error ? cause.message : 'Réessayez.'}`, { cause })
  }
}

export class CompanyAccountingSaveError extends Error {
  constructor(public readonly company: Company, cause: unknown) { super('La société est enregistrée, mais ses comptes ne le sont pas tous. Réessayez.', { cause }) }
}

export class ContactsService {
  constructor(private readonly repository: ContactsRepository | undefined, private readonly allowed: (permission: string) => boolean, private readonly accounting?: ThirdPartyAccountsService) {}
  private async run<T>(permission: string, action: (repository: ContactsRepository) => Promise<T>) {
    if (!this.allowed('contacts.read') || !this.allowed(permission)) throw new Error('Vous ne disposez pas des permissions nécessaires.')
    if (!this.repository) throw new Error('Le référentiel Contacts n’est pas configuré.')
    try { return await action(this.repository) }
    catch (error) {
      if (error instanceof ContactsUpgradeError) throw error
      if (error instanceof ClientResponseError) {
        console.error('[contacts] Request failed', { status: error.status })
        if (error.status === 400) return fail('Enregistrement refusé. Vérifiez les identifiants, les référentiels actifs, les doublons de rôle, l’adresse principale et les rattachements.')
        if (error.status === 409) return fail('Suppression impossible : des fiches ou pièces liées existent. Utilisez l’archivage.')
        if (error.status === 403) return fail('Cette action n’est pas autorisée.')
        if (error.status === 404) return fail('Fiche introuvable ou inaccessible. Vérifiez aussi l’installation du module Contacts.')
        return fail('Le référentiel Contacts est indisponible. Réessayez dans un instant.')
      }
      console.error('[contacts] Invalid response or operation')
      return fail('Les données Contacts n’ont pas pu être traitées. Réessayez ou contactez votre administrateur.')
    }
  }
  private files(files: ContactFiles) {
    for (const file of [files.image, ...files.gallery ?? []]) if (file && (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type) || file.size > 2097152)) throw new Error('Choisissez une image JPEG, PNG ou WebP de 2 Mio maximum.')
    if ((files.gallery?.length ?? 0) > 10) throw new Error('La galerie est limitée à dix images.')
  }
  summary() { return this.run('contacts.read', (repo) => repo.summary()) }
  ready() { return this.run('contacts.read', (repo) => repo.ensureRevision()) }
  companies(options: ListOptions) { return this.run('contacts.read', (repo) => repo.companies(options)) }
  people(options: ListOptions) { return this.run('contacts.read', (repo) => repo.people(options)) }
  company(id: string) { return this.run('contacts.read', (repo) => repo.company(id)) }
  person(id: string) { return this.run('contacts.read', (repo) => repo.person(id)) }
  saveCompany(input: CompanyInput, files: ContactFiles, id?: string, operation?: string) { const parsed = companyInputSchema.parse(input); if (parsed.siren && parsed.siret && !parsed.siret.startsWith(parsed.siren)) throw new Error('Le SIRET doit correspondre au SIREN.'); this.files(files); return this.run('contacts.write', (repo) => repo.saveCompany(parsed, files, id, operation)) }
  async saveCompanyDetails(input: CompanyInput, files: ContactFiles, address: AddressInput | undefined, id?: string, addressId?: string, roles?: readonly typeof roleValues[number][], accounts?: AccountDraft, extraAddresses?: AddressChange[], addressCreationId?: string) {
    // The address is optional and independently valid. Validate it before writing the company.
    const parsedAddress = address ? addressInputSchema.parse(address) : undefined
    const parsedExtras = extraAddresses?.map((entry) => ({ ...entry, input: addressInputSchema.parse(entry.input) }))
    const parsedAccounts = accounts ? accountDraftSchema.parse(accounts) : undefined
    const parsedRoles = roles?.map((role) => roleSchema.shape.role.parse(role))
    const operation = crypto.randomUUID()
    const company = await this.saveCompany(input, files, id, operation)
    if (parsedRoles) {
      try {
        const current = await this.company(company.id)
        for (const value of roleValues) {
          const existing = current.expand?.contacts_company_roles_via_company?.find((item) => item.role === value)
          const active = parsedRoles.includes(value)
          if (active !== Boolean(existing?.active)) await this.saveRole(company.id, value, active, existing?.id, operation)
        }
      } catch (error) { throw new CompanyRolesSaveError(company, error) }
    }
    if (parsedAddress || parsedExtras?.length) {
      try {
        if (parsedExtras?.length) {
          const entries = [...(parsedAddress ? [{ ...(addressId ? { id: addressId } : addressCreationId ? { creation_id: addressCreationId } : {}), input: { ...parsedAddress, company: company.id } }] : []), ...parsedExtras.map((entry) => ({ ...entry, input: { ...entry.input, company: company.id } }))]
          await this.run('contacts.write', (repo) => repo.saveAddresses(company.id, entries, operation))
        } else if (parsedAddress) await this.saveAddress({ ...parsedAddress, company: company.id }, addressId, operation)
      }
      catch (error) { throw new CompanyAddressSaveError(company, error) }
    }
    if (parsedAccounts) { try { if (!this.accounting) throw new Error('Comptabilité indisponible.'); await this.accounting.save(company.id, parsedAccounts, operation) } catch (cause) { throw new CompanyAccountingSaveError(company, cause) } }
    return company
  }
  savePerson(input: PersonInput, files: ContactFiles, id?: string) { const parsed = personInputSchema.parse(input); this.files(files); return this.run('contacts.write', (repo) => repo.savePerson(parsed, files, id)) }
  accounts(company: string) { return this.run('contacts.read', async () => { if (!this.accounting) throw new Error('Comptabilité indisponible.'); return this.accounting.list(company) }) }
  deleteRecord(kind: ContactKind, id: string) { return this.run('contacts.write', (repo) => repo.deleteRecord(kind, id)) }
  setActive(kind: ContactKind, id: string, active: boolean) { return this.run('contacts.write', (repo) => repo.setActive(kind, id, active)) }
  addresses(company: string) { return this.run('contacts.read', (repo) => repo.addresses(company)) }
  saveAddress(input: AddressInput, id?: string, operation?: string) { const parsed = addressInputSchema.parse(input); return this.run('contacts.write', (repo) => repo.saveAddress(parsed, id, operation)) }
  saveRole(company: string, role: typeof roleValues[number], active: boolean, id?: string, operation?: string) { const parsed = roleSchema.shape.role.parse(role); return this.run('contacts.write', (repo) => repo.saveRole(company, parsed, active, id, operation)) }
  removeGallery(id: string, filename: string) { return this.run('contacts.write', (repo) => repo.removeGallery(id, filename)) }
  imageURL(collectionId: string, id: string, filename: string) { return this.run('contacts.read', (repo) => repo.imageURL(collectionId, id, filename)) }
}
const allowed = (permission: string) => {
  const session = sessionService.getSnapshot()
  return session.status === 'authenticated' && hasPermission(session.user, permission)
}
export const contactsService = new ContactsService(
  environment.pocketBaseUrl ? createContactsRepository(environment.pocketBaseUrl) : undefined,
  allowed,
  environment.pocketBaseUrl ? new ThirdPartyAccountsService(createThirdPartyAccountsRepository(environment.pocketBaseUrl), allowed) : undefined,
)
