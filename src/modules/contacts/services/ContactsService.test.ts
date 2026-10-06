import { describe, expect, it, vi } from 'vitest'
import { ContactsService, CompanyAddressSaveError, CompanyRolesSaveError } from './ContactsService'
import type { ContactsRepository } from '../repositories/ContactsRepository'
import { companyInputSchema, personInputSchema, companySchema, roleSchema, addressInputSchema } from '../schemas/contacts'

const company = { name: ' Test ', legal_name: '', vat_number: '', lei: '', billing_email: '', einvoice_routing_address: '', einvoice_platform: '', einvoice_service_code: '', einvoice_status: 'unknown' as const, preferred_language: '', siren: '', siret: '', default_currency: '', website: '', phone: '', email: '', notes: '' }
function setup(permissions = ['contacts.read', 'contacts.write']) {
  const repository: ContactsRepository = { ensureRevision: vi.fn(), summary: vi.fn(), companies: vi.fn(), people: vi.fn(), company: vi.fn(), person: vi.fn(), saveCompany: vi.fn(), savePerson: vi.fn(), setActive: vi.fn(), deleteRecord: vi.fn(), addresses: vi.fn(), saveAddress: vi.fn(), saveAddresses: vi.fn(), saveRole: vi.fn(), removeGallery: vi.fn(), imageURL: vi.fn() }
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
    expect(repository.saveCompany).toHaveBeenCalledWith({ ...company, name: 'Test' }, {}, undefined, undefined)
  })
  it('rejette une image trop volumineuse avant la requête', () => {
    const { service, repository } = setup()
    expect(() => service.saveCompany(company, { image: new File([new Uint8Array(2097153)], 'large.png', { type: 'image/png' }) })).toThrow('2 Mio')
    expect(repository.saveCompany).not.toHaveBeenCalled()
  })
  it('limite les relations aux clients et fournisseurs, cumulables', async () => {
    const { service, repository } = setup()
    await service.saveRole('company', 'customer', true)
    await service.saveRole('company', 'supplier', true)
    expect(repository.saveRole).toHaveBeenNthCalledWith(1, 'company', 'customer', true, undefined, undefined)
    expect(repository.saveRole).toHaveBeenNthCalledWith(2, 'company', 'supplier', true, undefined, undefined)
    for (const value of ['prospect', 'partner', 'other']) expect(roleSchema.shape.role.safeParse(value).success).toBe(false)
  })
  it('enregistre les deux relations choisies dès la création', async () => {
    const { service, repository } = setup()
    const saved = companySchema.parse({ ...company, id: 'savedcompany', collectionId: 'companies', created: '', updated: '', active: true, logo: '', images: [] })
    vi.mocked(repository.saveCompany).mockResolvedValue(saved)
    vi.mocked(repository.company).mockResolvedValue(saved)
    await service.saveCompanyDetails(company, {}, undefined, undefined, undefined, ['customer', 'supplier'])
    expect(repository.saveRole).toHaveBeenNthCalledWith(1, saved.id, 'customer', true, undefined, expect.any(String))
    expect(repository.saveRole).toHaveBeenNthCalledWith(2, saved.id, 'supplier', true, undefined, expect.any(String))
    const operation = vi.mocked(repository.saveCompany).mock.calls[0]?.[3]
    expect(operation).toBeTruthy()
    expect(vi.mocked(repository.saveRole).mock.calls.every((call) => call[4] === operation)).toBe(true)
  })
  it('conserve la société et évite de recréer une relation déjà enregistrée après erreur', async () => {
    const { service, repository } = setup()
    const saved = companySchema.parse({ ...company, id: 'savedcompany', collectionId: 'companies', created: '', updated: '', active: true, logo: '', images: [], expand: { contacts_company_roles_via_company: [{ id: 'customerrole', collectionId: 'roles', created: '', updated: '', company: 'savedcompany', role: 'customer', active: true }] } })
    vi.mocked(repository.saveCompany).mockResolvedValue(saved)
    vi.mocked(repository.company).mockResolvedValue(saved)
    vi.mocked(repository.saveRole).mockRejectedValue(new Error('relation refusée'))
    const error = await service.saveCompanyDetails(company, {}, undefined, saved.id, undefined, ['customer', 'supplier']).catch((failure: unknown) => failure)
    expect(error).toBeInstanceOf(CompanyRolesSaveError)
    expect(error).toMatchObject({ company: { id: saved.id } })
    expect(repository.saveRole).toHaveBeenCalledExactlyOnceWith(saved.id, 'supplier', true, undefined, expect.any(String))
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
  it('valide l’adresse avant de créer la société', async () => {
    const { service, repository } = setup()
    await expect(service.saveCompanyDetails(company, {}, { company: 'pending', type: 'registered', line1: '', line2: '', postal_code: '', city: 'Paris', country: 'FR', state_region: '', is_primary: true })).rejects.toThrow('Saisissez une adresse')
    expect(repository.saveCompany).not.toHaveBeenCalled()
  })
  it('conserve la société enregistrée lorsque l’adresse échoue', async () => {
    const { service, repository } = setup()
    const saved = companySchema.parse({ ...company, id: 'savedcompany', collectionId: 'companies', created: '', updated: '', active: true, logo: '', images: [] })
    vi.mocked(repository.saveCompany).mockResolvedValue(saved)
    vi.mocked(repository.saveAddress).mockRejectedValue(new Error('adresse refusée'))
    const address = { company: 'pending', type: 'registered' as const, line1: '1 rue du Test', line2: '', postal_code: '75001', city: 'Paris', country: 'FR', state_region: '', is_primary: true }
    const error = await service.saveCompanyDetails(company, {}, address).catch((failure: unknown) => failure)
    expect(error).toBeInstanceOf(CompanyAddressSaveError)
    expect(error).toMatchObject({ company: { id: 'savedcompany' } })
    expect(repository.saveAddress).toHaveBeenCalledWith({ ...address, label: '', email: '', company: 'savedcompany' }, undefined, expect.any(String))
  })

  it('refuse les totaux du répertoire sans permission de lecture', async () => {
    const { service, repository } = setup([])
    await expect(service.summary()).rejects.toThrow('permissions')
    expect(repository.summary).not.toHaveBeenCalled()
  })
  it('retourne les totaux serveur sans les déduire de la page courante', async () => {
    const { service, repository } = setup()
    const summary = { people: 41, companies: 30, customers: 12, suppliers: 5 }
    vi.mocked(repository.summary).mockResolvedValue(summary)
    await expect(service.summary()).resolves.toEqual(summary)
  })

})

describe('Adresses postales et e-mails de société', () => {
  const email = { company: 'pending', type: 'billing' as const, email: ' factures@test.fr ', label: 'Comptabilité', line1: '', line2: '', postal_code: '', city: '', country: '', state_region: '', is_primary: false }
  it('accepte un e-mail seul, exige un contenu et une adresse postale complète', () => {
    expect(addressInputSchema.parse(email).email).toBe('factures@test.fr')
    expect(addressInputSchema.safeParse({ ...email, email: '' }).success).toBe(false)
    expect(addressInputSchema.safeParse({ ...email, email: 'invalide' }).success).toBe(false)
    expect(addressInputSchema.safeParse({ ...email, line1: '1 rue du Test' }).success).toBe(false)
    expect(addressInputSchema.safeParse({ ...email, line1: '1 rue du Test', city: 'Paris', country: 'FR' }).success).toBe(true)
  })
  it('refuse une adresse supplémentaire invalide avant toute écriture de la fiche', async () => {
    const { service, repository } = setup()
    await expect(service.saveCompanyDetails(company, {}, undefined, undefined, undefined, undefined, undefined, [{ creation_id: 'addressnew12345', input: { ...email, email: '' } }])).rejects.toThrow()
    expect(repository.saveCompany).not.toHaveBeenCalled()
    expect(repository.saveAddresses).not.toHaveBeenCalled()
  })
  it('sauvegarde les adresses ensemble et conserve leurs identifiants pour une reprise', async () => {
    const { service, repository } = setup()
    const saved = companySchema.parse({ ...company, id: 'savedcompany', collectionId: 'companies', created: '', updated: '', active: true, logo: '', images: [] })
    vi.mocked(repository.saveCompany).mockResolvedValue(saved)
    vi.mocked(repository.saveAddresses).mockRejectedValueOnce(new Error('réponse perdue')).mockResolvedValueOnce([])
    const entries = [{ creation_id: 'addressnew12345', input: email }]
    const primary = { ...email, type: 'registered' as const, label: 'Siège' }
    await expect(service.saveCompanyDetails(company, {}, primary, saved.id, undefined, undefined, undefined, entries, 'primaryaddr0001')).rejects.toBeInstanceOf(CompanyAddressSaveError)
    await service.saveCompanyDetails(company, {}, primary, saved.id, undefined, undefined, undefined, entries, 'primaryaddr0001')
    for (const call of vi.mocked(repository.saveAddresses).mock.calls) expect(call[1]).toEqual([{ creation_id: 'primaryaddr0001', input: { ...primary, email: 'factures@test.fr', company: saved.id } }, { creation_id: 'addressnew12345', input: { ...email, email: 'factures@test.fr', company: saved.id } }])
    expect(repository.saveAddress).not.toHaveBeenCalled()
    expect(vi.mocked(repository.saveAddresses).mock.calls[1]?.[2]).toBe(vi.mocked(repository.saveCompany).mock.calls[1]?.[3])
  })
})
