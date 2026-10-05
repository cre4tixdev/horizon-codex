import { z } from 'zod'
import type { LookupPreview } from '../schemas/companyLookup'

const nullableText = z.string().nullish()
const establishmentSchema = z.object({
  siret: nullableText, adresse: nullableText, numero_voie: z.union([z.string(), z.number()]).nullish(),
  indice_repetition: nullableText, type_voie: nullableText, libelle_voie: nullableText, complement_adresse: nullableText,
  code_postal: nullableText, libelle_commune: nullableText, code_pays_etranger: nullableText, statut_diffusion_etablissement: nullableText,
})
const companySchema = z.object({
  siren: z.string().regex(/^\d{9}$/), nom_complet: nullableText, nom_raison_sociale: nullableText, statut_diffusion: nullableText,
  tva: z.array(z.string()).nullish(), siege: establishmentSchema.nullish(), matching_etablissements: z.array(establishmentSchema).nullish(),
})
const responseSchema = z.object({ results: z.array(companySchema) })
type PublicCompany = z.infer<typeof companySchema>
const text = (value: string | number | null | undefined) => value == null ? '' : String(value).trim()
const publiclyAvailable = (company: PublicCompany) => !company.statut_diffusion || company.statut_diffusion === 'O'
function establishmentFor(company: PublicCompany, identifier: string) {
  if (identifier.length !== 14) return company.siege
  if (company.siege?.siret === identifier) return company.siege
  return company.matching_etablissements?.find((item) => item.siret === identifier)
}

export function createCompanyLookupRepository() {
  async function results(query: string) {
    const parameters = new URLSearchParams({ q: query, per_page: '10', minimal: 'true', include: 'siege,matching_etablissements,tva' })
    let response: Response
    try { response = await fetch(`https://recherche-entreprises.api.gouv.fr/search?${parameters}`, { credentials: 'omit', signal: AbortSignal.timeout(10_000) }) }
    catch { throw new Error('La recherche d’entreprises est indisponible. Vérifiez votre connexion puis réessayez.') }
    if (response.status === 429) throw new Error('Trop de recherches auprès du service public. Réessayez plus tard.')
    if (!response.ok) throw new Error('La recherche d’entreprises est indisponible. Réessayez plus tard.')
    try { return responseSchema.parse(await response.json()).results.slice(0, 10) }
    catch { throw new Error('La réponse du service public n’a pas pu être traitée. Réessayez plus tard.') }
  }
  return {
    async search(input: string) {
      const compact = input.replace(/\s/g, '')
      const query = /^\d{9}$|^\d{14}$/.test(compact) ? compact : input.trim()
      if (query.length < 3 || query.length > 160) throw new Error('Saisissez entre trois et 160 caractères.')
      const exact = /^\d{9}$|^\d{14}$/.test(query)
      const items = (await results(query)).filter((company) => publiclyAvailable(company) && (!exact || company.siren === query.slice(0, 9))).flatMap((company) => {
        const establishment = establishmentFor(company, exact && query.length === 14 ? query : '')
        if (exact && query.length === 14 && !establishment) return []
        const publicAddress = establishment && (!establishment.statut_diffusion_etablissement || establishment.statut_diffusion_etablissement === 'O')
        return [{ identifier: exact && query.length === 14 ? query : company.siren, name: text(company.nom_complet) || text(company.nom_raison_sociale) || company.siren, siret: text(establishment?.siret), address: publicAddress ? text(establishment.adresse) : '' }]
      })
      return { items }
    },
    async preview(identifier: string): Promise<LookupPreview> {
      if (!/^\d{9}$|^\d{14}$/.test(identifier)) throw new Error('SIREN ou SIRET invalide.')
      const company = (await results(identifier)).find((item) => item.siren === identifier.slice(0, 9))
      if (!company) throw new Error('Aucune entreprise trouvée.')
      if (!publiclyAvailable(company)) throw new Error('Entreprise en diffusion restreinte : utilisez la saisie manuelle.')
      const establishment = establishmentFor(company, identifier)
      if (identifier.length === 14 && !establishment) throw new Error('Établissement introuvable pour ce SIRET.')
      const fields: LookupPreview['fields'] = { siren: company.siren }
      const name = text(company.nom_complet) || text(company.nom_raison_sociale)
      if (name) fields.name = name
      const legalName = text(company.nom_raison_sociale) || name
      if (legalName) fields.legal_name = legalName
      if (/^\d{14}$/.test(text(establishment?.siret))) fields.siret = text(establishment?.siret)
      const vatNumbers = [...new Set((company.tva ?? []).map(text).filter(Boolean))]
      if (vatNumbers.length === 1) fields.vat_number = vatNumbers[0]
      let address: LookupPreview['address'] = null
      if (establishment && (!establishment.statut_diffusion_etablissement || establishment.statut_diffusion_etablissement === 'O') && !text(establishment.code_pays_etranger)) {
        const line1 = [establishment.numero_voie, establishment.indice_repetition, establishment.type_voie, establishment.libelle_voie].map(text).filter(Boolean).join(' ')
        const city = text(establishment.libelle_commune)
        if (line1 && city) address = { line1, line2: text(establishment.complement_adresse), postal_code: text(establishment.code_postal), city, country: 'FR' }
      }
      return { fields, address, ...(vatNumbers.length > 1 ? { vat_numbers: vatNumbers } : {}) }
    },
  }
}
