import { describe, expect, it, vi } from 'vitest'
import { ContactsService } from './ContactsService'
import type { ContactsRepository } from '../repositories/ContactsRepository'
import { companyInputSchema, personInputSchema } from '../schemas/contacts'

const company = { name: ' Test ', legal_name: '', vat_number: '', fiscal_identifier: '', preferred_language: '', preferred_currency: '', default_currency: '', website: '', phone: '', email: '', notes: '' }
function setup(permissions = ['contacts.read', 'contacts.write']) {
  const repository: ContactsRepository = { companies: vi.fn(), people: vi.fn(), company: vi.fn(), person: vi.fn(), saveCompany: vi.fn(), savePerson: vi.fn(), setActive: vi.fn(), addresses: vi.fn(), saveAddress: vi.fn(), saveRole: vi.fn(), removeGallery: vi.fn(), imageURL: vi.fn() }
  return { service: new ContactsService(repository, (permission) => permissions.includes(permission)), repository }
}
describe('Contacts service', () => {
  it('refuse la lecture sans permission avant toute requête', async () => {
    const { service, repository } = setup([])
    await expect(service.companies({ page: 1, search: '', archived: false })).rejects.toThrow('permissions')
    expect(repository.companies).not.toHaveBeenCalled()
  })
  it('refuse une écriture pour un lecteur seul', async () => {
    const { service, repository } = setup(['contacts.read'])
    await expect(service.saveCompany(company, {})).rejects.toThrow('permissions')
    expect(repository.saveCompany).not.toHaveBeenCalled()
  })
  it('exige la lecture en plus de l’écriture', async () => {
    const { service } = setup(['contacts.write'])
    await expect(service.saveCompany(company, {})).rejects.toThrow('permissions')
  })
  it('normalise la saisie et transmet une seule sauvegarde explicite', async () => {
    const { service, repository } = setup()
    await service.saveCompany(company, {})
    expect(repository.saveCompany).toHaveBeenCalledWith({ ...company, name: 'Test' }, {}, undefined)
  })
  it('rejette une image trop volumineuse avant la requête', () => {
    const { service, repository } = setup()
    expect(() => service.saveCompany(company, { image: new File([new Uint8Array(2097153)], 'large.png', { type: 'image/png' }) })).toThrow('2 Mio')
    expect(repository.saveCompany).not.toHaveBeenCalled()
  })
  it('archive sans effacer', async () => {
    const { service, repository } = setup()
    await service.setActive('companies', 'company', false)
    expect(repository.setActive).toHaveBeenCalledWith('companies', 'company', false)
  })
  it('valide les URLs et demande au moins un nom de personne', () => {
    expect(companyInputSchema.safeParse({ ...company, website: 'javascript:alert(1)' }).success).toBe(false)
    const input = { company: '', first_name: ' ', last_name: '', job_title: '', email: '', phone: '', mobile: '', notes: '' }
    expect(personInputSchema.safeParse(input).success).toBe(false)
    expect(personInputSchema.safeParse({ ...input, first_name: ' Alice ' }).success).toBe(true)
  })
})
