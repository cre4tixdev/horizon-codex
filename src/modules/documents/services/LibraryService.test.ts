import { describe, expect, it, vi } from 'vitest'
import { ClientResponseError } from 'pocketbase'
import { LibraryService } from './LibraryService'
import type { createLibraryRepository } from '../repositories/LibraryRepository'
const input = { name: '', space: 'affairs' as const, folder: '', category: '', tags: [], description: '', visibility: 'team' as const, readers: [], links: [] }
function setup(allowed = true) {
  const repository: ReturnType<typeof createLibraryRepository> = { context: vi.fn(), list: vi.fn(), record: vi.fn(), choices: vi.fn(), search: vi.fn(), upload: vi.fn(), save: vi.fn(), version: vi.fn(), archive: vi.fn(), folder: vi.fn(), category: vi.fn(), file: vi.fn() }
  return { repository, service: new LibraryService(repository, () => allowed) }
}
describe('LibraryService', () => {
  it('denies private document reads and downloads before invoking the repository', async () => {
    const { service, repository } = setup(false)
    await expect(service.record('private12345678')).rejects.toThrow('accès nécessaire')
    await expect(service.file('private12345678', 'version12345678')).rejects.toThrow('accès nécessaire')
    expect(repository.record).not.toHaveBeenCalled(); expect(repository.file).not.toHaveBeenCalled()
  })
  it('propagates request cancellation without logging it as a technical failure', async () => {
    const { service, repository } = setup(), log = vi.spyOn(console, 'error').mockImplementation(() => {})
    const aborted = new ClientResponseError({ status: 0, isAbort: true })
    try {
      vi.mocked(repository.list).mockRejectedValueOnce(aborted)
      await expect(service.list({ space: 'internal' })).rejects.toBe(aborted)
      expect(log).not.toHaveBeenCalled()
    } finally { log.mockRestore() }
  })
  it('rejects executable files, excessive batches and a version without a reason', () => {
    const { service, repository } = setup()
    const pdf = new File(['%PDF'], 'plan.pdf', { type: 'application/pdf' })
    expect(() => service.upload(input, [new File(['code'], 'page.html')])).toThrow('fichiers autorisés')
    expect(() => service.upload(input, Array.from({ length: 11 }, () => pdf))).toThrow('fichiers autorisés')
    expect(() => service.version('document1234567', 'updated', ' ', pdf)).toThrow('ce qui a changé')
    expect(repository.upload).not.toHaveBeenCalled(); expect(repository.version).not.toHaveBeenCalled()
  })
  it('reports concurrency conflicts without logging file contents or metadata', async () => {
    const { service, repository } = setup(), log = vi.spyOn(console, 'error').mockImplementation(() => {})
    try {
      vi.mocked(repository.archive).mockRejectedValueOnce(new ClientResponseError({ status: 409, response: { message: 'Ce document a changé.', private: 'contenu confidentiel' } }))
      await expect(service.archive('document1234567', 'old', true)).rejects.toThrow('Ce document a changé.')
      expect(log).toHaveBeenCalledWith('[documents-library] Operation failed', { status: 409 })
      expect(JSON.stringify(log.mock.calls)).not.toContain('confidentiel')
    } finally { log.mockRestore() }
  })
})
