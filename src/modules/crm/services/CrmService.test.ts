import { describe, expect, it, vi } from 'vitest'
import { CrmService } from './CrmService'
import type { CrmRepository } from '../repositories/CrmRepository'
import { opportunityDraft } from '../schemas/opportunities'
const input = { ...opportunityDraft(), title: 'Studio', company: 'company00000001', owner: 'owner0000000001', stage: 'stage0000000001' }
const options = { search: '', archived: false, page: 1, company: '', owner: '', status: '', sort: '-created' }
function setup(permissions: string[]) {
  const repository: CrmRepository = { list: vi.fn(), summary: vi.fn(), record: vi.fn(), stages: vi.fn(), owners: vi.fn(), save: vi.fn(), move: vi.fn(), archive: vi.fn(), remove: vi.fn() }
  return { repository, service: new CrmService(repository, (permission) => permissions.includes(permission)) }
}
describe('CRM permissions and validated write boundary', () => {
  it('denies reads and writes without CRM permissions', async () => {
    const { service, repository } = setup(['contacts.read', 'contacts.write'])
    await expect(service.list(options)).rejects.toThrow('permissions CRM')
    await expect(service.save(input, 'creation-key-local')).rejects.toThrow('permissions CRM')
    expect(repository.list).not.toHaveBeenCalled(); expect(repository.save).not.toHaveBeenCalled()
  })
  it('allows reading but rejects every mutation for a CRM reader', async () => {
    const { service, repository } = setup(['crm.read'])
    await service.list(options)
    await expect(service.save(input, 'creation-key-local')).rejects.toThrow('permissions CRM')
    await expect(service.move([{ id: 'opportunity0001', stage: input.stage, updated: '' }])).rejects.toThrow('permissions CRM')
    await expect(service.archive('opportunity0001', false)).rejects.toThrow('permissions CRM')
    await expect(service.remove('opportunity0001')).rejects.toThrow('permissions CRM')
    expect(repository.list).toHaveBeenCalledExactlyOnceWith(options)
    expect(repository.save).not.toHaveBeenCalled(); expect(repository.move).not.toHaveBeenCalled()
  })
  it('validates amounts and probabilities before persisting and preserves creation key for retries', async () => {
    const { service, repository } = setup(['crm.read', 'crm.write'])
    expect(() => service.save({ ...input, probability: 101 }, 'creation-key-local')).toThrow()
    expect(() => service.save({ ...input, estimated_value: -1 }, 'creation-key-local')).toThrow()
    expect(repository.save).not.toHaveBeenCalled()
    await service.save(input, 'creation-key-local')
    expect(repository.save).toHaveBeenCalledExactlyOnceWith(input, 'creation-key-local', undefined)
  })
})
