import { ClientResponseError } from 'pocketbase'
import { z } from 'zod'
import { describe, expect, it, vi } from 'vitest'
import { ActivityService } from './ActivityService'
import type { createActivityRepository } from '../repositories/ActivityRepository'
const source = { entity: 'contacts_companies' as const, id: 'company12345678' }
const publication = { type: 'note' as const, body: 'Commentaire', mentions: [] }
function setup(allowed = true) {
  const repository: ReturnType<typeof createActivityRepository> = { avatar: vi.fn(), list: vi.fn(), users: vi.fn(), publish: vi.fn(), tasks: vi.fn(), updateTask: vi.fn(), emailAttachment: vi.fn(), attachmentURL: vi.fn(), removeAttachment: vi.fn() }
  return { repository, service: new ActivityService(repository, () => allowed) }
}
describe('ActivityService', () => {
  it('distinguishes access errors from an invalid response without logging its contents', async () => {
    const { repository, service } = setup()
    const log = vi.spyOn(console, 'error').mockImplementation(() => {})
    try {
      vi.mocked(repository.list).mockRejectedValueOnce(new ClientResponseError({ status: 403 }))
      await expect(service.list(source, 1, 'all')).rejects.toThrow('pas accès')
      const parsed = z.object({ items: z.array(z.object({ id: z.string() })) }).safeParse({ items: [{ id: { private: 'confidential content' } }] })
      if (parsed.success) throw new Error('Expected invalid fixture')
      vi.mocked(repository.list).mockRejectedValueOnce(parsed.error)
      await expect(service.list(source, 1, 'all')).rejects.toThrow('données illisibles')
      expect(log).toHaveBeenLastCalledWith('[activity] Operation failed', { status: undefined, validation: [{ code: 'invalid_type', path: 'items.0.id' }] })
      expect(JSON.stringify(log.mock.calls)).not.toContain('confidential content')
    } finally { log.mockRestore() }
  })
  it('does not describe a rejected GET as a publication failure', async () => {
    const { repository, service } = setup()
    const log = vi.spyOn(console, 'error').mockImplementation(() => {})
    try {
      vi.mocked(repository.list).mockRejectedValueOnce(new ClientResponseError({ status: 400 }))
      await expect(service.list(source, 1, 'all')).rejects.toThrow('Chargement du fil refusé')
      vi.mocked(repository.publish).mockRejectedValueOnce(new ClientResponseError({ status: 400 }))
      await expect(service.publish(source, publication, [])).rejects.toThrow('Publication refusée')
    } finally { log.mockRestore() }
  })
  it('denies reading and publication before any repository request', async () => {
    const { repository, service } = setup(false)
    await expect(service.list(source, 1, 'all')).rejects.toThrow('permissions')
    await expect(service.publish(source, publication, [])).rejects.toThrow('permissions')
    await expect(service.removeAttachment('event1234567890', 'note.txt')).rejects.toThrow('permissions')
    expect(repository.list).not.toHaveBeenCalled()
    expect(repository.publish).not.toHaveBeenCalled()
    expect(repository.removeAttachment).not.toHaveBeenCalled()
  })
  it('refuses empty messages, oversize files, unsupported files and more than five files', () => {
    const { repository, service } = setup()
    expect(() => service.publish(source, { ...publication, body: ' ' }, [])).toThrow('message')
    const text = new File(['note'], 'note.txt', { type: 'text/plain' })
    expect(() => service.publish(source, publication, Array(6).fill(text))).toThrow('5 fichiers')
    expect(() => service.publish(source, publication, [new File(['x'], 'script.html', { type: 'text/html' })])).toThrow('5 fichiers')
    expect(() => service.publish(source, publication, [new File([new Uint8Array(10485761)], 'large.txt', { type: 'text/plain' })])).toThrow('10 Mio')
    expect(repository.publish).not.toHaveBeenCalled()
  })
  it('publishes attachments only through explicit publication and preserves a valid comment', async () => {
    const { repository, service } = setup()
    const file = new File(['texte'], 'note.txt', { type: 'text/plain' })
    await service.publish(source, { ...publication, body: ' Commentaire ' }, [file])
    expect(repository.publish).toHaveBeenCalledExactlyOnceWith(source, publication, [file])
  })
  it('rejects task publication without a task payload', () => {
    const { service, repository } = setup()
    expect(() => service.publish(source, { ...publication, type: 'task' }, [])).toThrow('tâche')
    expect(repository.publish).not.toHaveBeenCalled()
  })
})
