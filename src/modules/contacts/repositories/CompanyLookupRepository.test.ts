import { afterEach, describe, expect, it, vi } from 'vitest'
import { createCompanyLookupRepository } from './CompanyLookupRepository'

const company = {
  siren: '123456789', nom_complet: 'Nom usuel', nom_raison_sociale: 'Nom légal SAS', statut_diffusion: 'O',
  siege: { siret: '12345678900001', numero_voie: 8, type_voie: 'rue', libelle_voie: 'des Tests', complement_adresse: 'Bâtiment A', code_postal: '75001', libelle_commune: 'Paris', statut_diffusion_etablissement: 'O' },
}
function mockResults(results: unknown[]) {
  return vi.stubGlobal('fetch', vi.fn().mockImplementation(async () => new Response(JSON.stringify({ results }), { status: 200 })))
}
afterEach(() => vi.unstubAllGlobals())
describe('Recherche publique d’entreprises depuis le navigateur', () => {
  it('appelle uniquement l’API publique, sans cookies ni authentification Horizon', async () => {
    mockResults([company])
    await createCompanyLookupRepository().search('123 456 789 00001')
    const [url, options] = vi.mocked(fetch).mock.calls[0]!
    expect(new URL(String(url)).origin).toBe('https://recherche-entreprises.api.gouv.fr')
    expect(new URL(String(url)).searchParams.get('q')).toBe('12345678900001')
    expect(options).toEqual({ credentials: 'omit', signal: expect.any(AbortSignal) })
  })
  it('reprend uniquement les informations disponibles, sans inventer de TVA', async () => {
    mockResults([company])
    expect(await createCompanyLookupRepository().preview(company.siren)).toEqual({
      fields: { name: 'Nom usuel', legal_name: 'Nom légal SAS', siren: company.siren, siret: company.siege.siret },
      address: { line1: '8 rue des Tests', line2: 'Bâtiment A', postal_code: '75001', city: 'Paris', country: 'FR' },
    })
  })
  it('reprend l’établissement exact plutôt que le siège pour un SIRET', async () => {
    const branch = { ...company.siege, siret: '12345678900002', libelle_commune: 'Lyon', code_postal: '69001' }
    mockResults([{ ...company, matching_etablissements: [branch] }])
    const result = await createCompanyLookupRepository().preview(branch.siret)
    expect(result.fields.siret).toBe(branch.siret)
    expect(result.address?.city).toBe('Lyon')
  })
  it('refuse un SIRET absent des établissements retournés', async () => {
    mockResults([company])
    const repository = createCompanyLookupRepository()
    expect((await repository.search('12345678999999')).items).toEqual([])
    await expect(repository.preview('12345678999999')).rejects.toThrow('Établissement introuvable')
  })
  it('exclut les entreprises en diffusion restreinte et leur aperçu', async () => {
    mockResults([{ ...company, statut_diffusion: 'P' }])
    const repository = createCompanyLookupRepository()
    expect((await repository.search('Nom')).items).toEqual([])
    await expect(repository.preview(company.siren)).rejects.toThrow('diffusion restreinte')
  })
  it('ne reporte pas une adresse restreinte, étrangère ou incomplète', async () => {
    for (const override of [{ statut_diffusion_etablissement: 'P' }, { code_pays_etranger: '99132' }, { libelle_voie: '', numero_voie: null, type_voie: '' }]) {
      mockResults([{ ...company, siege: { ...company.siege, ...override } }])
      expect((await createCompanyLookupRepository().preview(company.siren)).address).toBeNull()
    }
  })
  it('signale les quotas et réponses invalides sans masquer l’échec', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('', { status: 429 })))
    await expect(createCompanyLookupRepository().search('Nom')).rejects.toThrow('Trop de recherches')
    mockResults([{ siren: 'invalide' }])
    await expect(createCompanyLookupRepository().search('Nom')).rejects.toThrow('réponse du service public')
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('Network')))
    await expect(createCompanyLookupRepository().search('Nom')).rejects.toThrow('Vérifiez votre connexion')
  })
  it('propose la TVA fournie par la DGFiP et demande un choix si plusieurs numéros existent', async () => {
    mockResults([{ ...company, tva: ['FR00123456789'] }])
    expect((await createCompanyLookupRepository().preview(company.siren)).fields.vat_number).toBe('FR00123456789')
    mockResults([{ ...company, tva: ['FR00123456789', 'FR99123456789', 'FR00123456789'] }])
    const preview = await createCompanyLookupRepository().preview(company.siren)
    expect(preview.fields.vat_number).toBeUndefined()
    expect(preview.vat_numbers).toEqual(['FR00123456789', 'FR99123456789'])
    const url = String(vi.mocked(fetch).mock.calls[0]![0])
    expect(new URL(url).searchParams.get('include')).toContain('tva')
  })
  it('valide les identifiants avant toute requête', async () => {
    mockResults([])
    await expect(createCompanyLookupRepository().preview('abc')).rejects.toThrow('invalide')
    await expect(createCompanyLookupRepository().search('a')).rejects.toThrow('trois')
    expect(fetch).not.toHaveBeenCalled()
  })
})
