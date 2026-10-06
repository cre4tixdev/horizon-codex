import { describe, expect, it, vi } from 'vitest'
import { ViewsService } from './ViewsService'
import type { createViewsRepository } from './ViewsRepository'
import { savedViewInputSchema } from './types'

function setup(allowed = true) {
  const repository: ReturnType<typeof createViewsRepository> = { list: vi.fn(), save: vi.fn(), remove: vi.fn() }
  return { service: new ViewsService(repository, () => allowed), repository }
}
describe('vues enregistrées', () => {
  it('ne fait aucune requête sans permission de lecture', async () => {
    const { service, repository } = setup(false)
    await expect(service.list('contacts.companies')).rejects.toThrow('permissions')
    expect(repository.list).not.toHaveBeenCalled()
  })
  it('permet au lecteur de créer une vue globale sans changer les données métier', async () => {
    const { service, repository } = setup()
    await service.save({ name: ' Clients ', context: 'contacts.companies', visibility: 'shared', params: { role: 'customer', group: 'country', sort: 'email:desc' } })
    expect(repository.save).toHaveBeenCalledWith({ name: 'Clients', context: 'contacts.companies', visibility: 'shared', params: { role: 'customer', group: 'country', sort: 'email:desc' } }, undefined)
  })
  it('refuse critères libres et combinaison incompatible avec le contexte', () => {
    expect(savedViewInputSchema.safeParse({ name: 'X', context: 'contacts.companies', visibility: 'personal', params: { sql: 'SELECT *' } }).success).toBe(false)
    expect(savedViewInputSchema.safeParse({ name: 'X', context: 'contacts.companies', visibility: 'personal', params: { group: 'company' } }).success).toBe(false)
    expect(savedViewInputSchema.safeParse({ name: 'X', context: 'contacts.people', visibility: 'personal', params: { sort: 'legal_name:desc' } }).success).toBe(false)
  })
})
