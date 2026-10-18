import { describe, expect, it } from 'vitest'
import { parseCsv, sheetSource } from './files'
import { suggestMapping } from '../schemas/imports'
describe('lecture et mapping des imports Contacts', () => {
  it('lit BOM, séparateurs, guillemets échappés et retours à la ligne dans une cellule', () => {
    expect(parseCsv('\uFEFFNom;E-mail\r\n"CVS; Engineering";contact@example.fr\r\n"Deux ""noms""\nligne";test@example.fr')).toEqual([['Nom', 'E-mail'], ['CVS; Engineering', 'contact@example.fr'], ['Deux "noms"\nligne', 'test@example.fr']])
    expect(parseCsv('"Nom;exemple",Email\nCVS,a@b.fr')).toEqual([['Nom;exemple', 'Email'], ['CVS', 'a@b.fr']])
    expect(parseCsv('\nNom,Email\nCVS,test@example.fr')[0]).toEqual([''])
    expect(() => parseCsv('Nom;Email\n"Non fermé;test')).toThrow('non fermé')
  })
  it('préserve zéros, colonnes vides et sélection de l’en-tête', () => {
    const data = sheetSource({ name: 'Clients', data: [['Export'], ['Nom', '', 'SIREN'], ['CVS', '', '012345678']] }, 2, 'clients.csv')
    expect(data.headers).toEqual(['Nom', 'Colonne 2', 'SIREN']); expect(data.rows[0]?.[2]).toBe('012345678')
    expect(() => sheetSource({ name: 'Vide', data: [] }, 1, 'vide.csv')).toThrow()
  })
  it('propose un mapping accent/casse, sans inventer des champs inconnus', () => {
    expect(suggestMapping('companies', ['Société', 'SIREN', 'E-mail', 'Colonne inconnue'])).toEqual({ name: 0, siren: 1, email: 2 })
    expect(suggestMapping('people', ['Prénom', 'Nom', 'Société'])).toEqual({ first_name: 0, last_name: 1, company_name: 2 })
  })
})
