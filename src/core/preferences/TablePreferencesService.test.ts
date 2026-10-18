import { describe, expect, it, vi } from 'vitest'
import { ClientResponseError } from 'pocketbase'
import { TablePreferencesService } from './TablePreferencesService'

const record = { revision: 1, preference: { order: ['name', 'email'], hidden: ['email'] } }
describe('TablePreferencesService', () => {
  it('requires a signed-in user and validates the preference before writing', async () => {
    const repository = { read: vi.fn().mockResolvedValue(record), save: vi.fn().mockResolvedValue(record) }
    const denied = new TablePreferencesService(repository, () => false)
    await expect(denied.read('contacts.companies')).rejects.toThrow('Connexion')
    expect(repository.read).not.toHaveBeenCalled()
    const service = new TablePreferencesService(repository, () => true)
    await expect(service.save('contacts.companies', { ...record, revision: -1 })).rejects.toThrow()
    expect(repository.save).not.toHaveBeenCalled()
    await expect(service.save('contacts.companies', record)).resolves.toEqual(record)
    await expect(service.save('contacts.companies', { ...record, preference: { ...record.preference, widths: { name: -1 } } })).rejects.toThrow()
  })
  it('explains a missing backend pack and conflicting edits', async () => {
    const log = vi.spyOn(console, 'error').mockImplementation(() => {})
    try {
      for (const [status, message] of [[404, 'pack PocketBase'], [409, 'autre navigateur']] as const) {
        const repository = { read: vi.fn().mockRejectedValue(new ClientResponseError({ status })), save: vi.fn() }
        await expect(new TablePreferencesService(repository, () => true).read('contacts.companies')).rejects.toThrow(message)
      }
    } finally { log.mockRestore() }
  })
})
