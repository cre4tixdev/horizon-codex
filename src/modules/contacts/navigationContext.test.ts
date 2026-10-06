import { describe, expect, it } from 'vitest'
import { directoryContext, directoryHref, directoryOptions } from './navigationContext'

describe('Contexte de navigation des fiches', () => {
  it('conserve les critères et valide le contexte du module', () => {
    const context = directoryContext({ contactDirectory: { kind: 'companies', query: 'q=Studio&role=customer&state=archived&group=country&sort=email:desc&view=list', page: 2 } }, 'companies')
    expect(directoryOptions(context, 'companies', true)).toEqual({ search: 'Studio', archived: true, role: 'customer', group: 'country', sort: 'email', descending: true, page: 1 })
    expect(directoryHref(context, 'companies')).toContain('/contacts?q=Studio')
    expect(directoryContext({ contactDirectory: { ...context, kind: 'people' } }, 'companies')).toBeUndefined()
    expect(directoryContext({ contactDirectory: { ...context, page: -1 } }, 'companies')).toBeUndefined()
  })
  it('utilise les archives de la fiche et les valeurs par défaut en accès direct', () => {
    expect(directoryOptions(undefined, 'companies', false)).toMatchObject({ archived: true, sort: 'name', descending: false })
    expect(directoryOptions({ kind: 'companies', query: 'sort=bad&role=partner&group=company', page: 1 }, 'companies', true)).toMatchObject({ group: undefined, role: undefined, sort: 'name' })
  })
})
