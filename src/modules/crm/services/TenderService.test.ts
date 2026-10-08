import { describe, expect, it, vi } from 'vitest'
import { TenderService } from './TenderService'
import type { TenderRepository } from '../repositories/TenderRepository'
const visit = { kind: 'visit' as const, start: '2026-10-10T10:00:00.000Z', end: '', timezone: 'Europe/Paris' as const, location: '', notes: '', participants: [], status: 'planned' as const }
function setup(write: boolean) {
  const repository: TenderRepository = { list: vi.fn(), summary: vi.fn(), record: vi.fn(), save: vi.fn(), archive: vi.fn(), watch: vi.fn(), appointments: vi.fn(), submissions: vi.fn(), saveAppointment: vi.fn(), move: vi.fn(), submit: vi.fn() }
  return { repository, service: new TenderService(repository, (permission) => permission === 'crm.read' || write) }
}
describe('TenderService write boundary', () => {
  it('allows a reader to consult but refuses all tender mutations', async () => {
    const { service, repository } = setup(false)
    await service.record('tender000000001')
    await service.list({ search: '', page: 1, archived: false, status: '', company: '', owner: '', sort: '-created' })
    await service.appointments('tender000000001')
    await service.submissions('tender000000001')
    await expect(service.saveAppointment('tender000000001', visit)).rejects.toThrow('permissions AO')
    await expect(service.archive('tender000000001', false, '')).rejects.toThrow('permissions AO')
    await expect(service.move('tender000000001', 'stage000000001', '')).rejects.toThrow('permissions AO')
    await expect(service.submit('tender000000001', { submitted_at: visit.start, timezone: visit.timezone, notes: '', documents: [{ event_id: 'event0000000001', filename: 'proof.pdf' }] }, 'key')).rejects.toThrow('permissions AO')
    expect(repository.saveAppointment).not.toHaveBeenCalled()
    expect(repository.submit).not.toHaveBeenCalled()
  })
  it('rejects appointments ending before their start and deposits without documents', () => {
    const { service, repository } = setup(true)
    expect(() => service.saveAppointment('tender000000001', { ...visit, end: '2026-10-09T10:00:00.000Z' })).toThrow()
    expect(() => service.submit('tender000000001', { submitted_at: visit.start, timezone: visit.timezone, notes: '', documents: [] }, 'key')).toThrow()
    expect(repository.saveAppointment).not.toHaveBeenCalled()
    expect(repository.submit).not.toHaveBeenCalled()
  })
})
