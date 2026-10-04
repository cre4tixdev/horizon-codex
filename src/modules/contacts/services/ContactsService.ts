import { ClientResponseError } from 'pocketbase'
import { environment } from '../../../core/config/environment'
import { sessionService } from '../../../core/auth/services/session'
import { hasPermission } from '../../../core/auth/types/session'
import { createContactsRepository, type ContactsRepository } from '../repositories/ContactsRepository'
import { addressInputSchema, companyInputSchema, personInputSchema, roleValues } from '../schemas/contacts'
import type { AddressInput, CompanyInput, ContactFiles, ContactKind, ListOptions, PersonInput } from '../types/contacts'

function fail(message: string): never { throw new Error(message) }

export class ContactsService {
  constructor(private readonly repository: ContactsRepository | undefined, private readonly allowed: (permission: string) => boolean) {}
  private async run<T>(permission: string, action: (repository: ContactsRepository) => Promise<T>) {
    if (!this.allowed('contacts.read') || !this.allowed(permission)) throw new Error('Vous ne disposez pas des permissions nécessaires.')
    if (!this.repository) throw new Error('Le référentiel Contacts n’est pas configuré.')
    try { return await action(this.repository) }
    catch (error) {
      if (error instanceof ClientResponseError) {
        console.error('[contacts] Request failed', { status: error.status })
        if (error.status === 400) return fail('Enregistrement refusé. Vérifiez les champs, les doublons de rôle et les rattachements à des sociétés archivées.')
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
  companies(options: ListOptions) { return this.run('contacts.read', (repo) => repo.companies(options)) }
  people(options: ListOptions) { return this.run('contacts.read', (repo) => repo.people(options)) }
  company(id: string) { return this.run('contacts.read', (repo) => repo.company(id)) }
  person(id: string) { return this.run('contacts.read', (repo) => repo.person(id)) }
  saveCompany(input: CompanyInput, files: ContactFiles, id?: string) { const parsed = companyInputSchema.parse(input); this.files(files); return this.run('contacts.write', (repo) => repo.saveCompany(parsed, files, id)) }
  savePerson(input: PersonInput, files: ContactFiles, id?: string) { const parsed = personInputSchema.parse(input); this.files(files); return this.run('contacts.write', (repo) => repo.savePerson(parsed, files, id)) }
  setActive(kind: ContactKind, id: string, active: boolean) { return this.run('contacts.write', (repo) => repo.setActive(kind, id, active)) }
  addresses(company: string) { return this.run('contacts.read', (repo) => repo.addresses(company)) }
  saveAddress(input: AddressInput, id?: string) { const parsed = addressInputSchema.parse(input); return this.run('contacts.write', (repo) => repo.saveAddress(parsed, id)) }
  saveRole(company: string, role: typeof roleValues[number], active: boolean, id?: string) { return this.run('contacts.write', (repo) => repo.saveRole(company, role, active, id)) }
  removeGallery(id: string, filename: string) { return this.run('contacts.write', (repo) => repo.removeGallery(id, filename)) }
  imageURL(collectionId: string, id: string, filename: string) { return this.run('contacts.read', (repo) => repo.imageURL(collectionId, id, filename)) }
}
export const contactsService = new ContactsService(environment.pocketBaseUrl ? createContactsRepository(environment.pocketBaseUrl) : undefined, (permission) => {
  const session = sessionService.getSnapshot()
  return session.status === 'authenticated' && hasPermission(session.user, permission)
})
