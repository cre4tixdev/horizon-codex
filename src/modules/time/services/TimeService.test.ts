import { describe, expect, it, vi } from 'vitest'
import { ClientResponseError } from 'pocketbase'
import type { Session } from '../../../core/auth/types/session'
import { createTimeService } from './TimeService'
import type { TimeSheet } from '../schemas/time'
const repo = () => ({ photo: vi.fn(), overview: vi.fn(), choices: vi.fn(), week: vi.fn(), record: vi.fn(), list: vi.fn(), correct: vi.fn(), save: vi.fn(), transition: vi.fn(), accounts: vi.fn(), sold: vi.fn(), favorite: vi.fn(), settings: vi.fn(), saveSettings: vi.fn() })
const session = (rights: string[], profile: 'user' | 'viewer' = 'user'): Session => ({ status: 'authenticated', user: { id: 'user', name: 'Test', email: 'test@example.invalid', erpProfile: profile, role: { id: 'role', label: 'Test', permissions: rights } } })
describe('Time service authorization', () => {
  it('refuse avant tout appel réseau les droits absents, révoqués et viewer', async () => {
    const r = repo(); let current = session(['time.read', 'time.write']); const service = createTimeService(r, { getSnapshot: () => current })
    await service.choices(); expect(r.choices).toHaveBeenCalledOnce()
    current = session([]); await expect(service.choices()).rejects.toThrow('Accès'); expect(r.choices).toHaveBeenCalledOnce()
    current = session(['time.read', 'time.write'], 'viewer'); await expect(service.save({ week_start: '2026-10-19', revision: 0, lines: [] })).rejects.toThrow('Accès'); expect(r.save).not.toHaveBeenCalled()
  })
  it('réserve la validation et la réouverture historique aux valideurs', async () => {
    const r = repo(), service = createTimeService(r, { getSnapshot: () => session(['time.read', 'time.write', 'time.submit']) })
    await expect(service.transition({} as TimeSheet, 'validate')).rejects.toThrow('Accès'); await expect(service.transition({} as TimeSheet, 'reopen_validated')).rejects.toThrow('Accès'); expect(r.transition).not.toHaveBeenCalled()
  })
  it('autorise la correction avec validate seul et refuse les writers et viewers', async () => {
    const r = repo(); let current = session(['time.read', 'time.validate']); const service = createTimeService(r, { getSnapshot: () => current }), sheet = {} as TimeSheet, input = { week_start: '2026-10-05', revision: 1, lines: [] }
    await service.correct(sheet, input, 'Durée vérifiée'); expect(r.correct).toHaveBeenCalledWith(sheet, input, 'Durée vérifiée')
    current = session(['time.read', 'time.write']); await expect(service.correct(sheet, input, 'Motif')).rejects.toThrow('Accès')
    current = session(['time.read', 'time.validate'], 'viewer'); await expect(service.correct(sheet, input, 'Motif')).rejects.toThrow('Accès'); expect(r.correct).toHaveBeenCalledOnce()
  })
  it('transmet le conflit serveur compréhensible sans exposer le contenu technique', async () => {
    const r = repo(); r.week.mockRejectedValue(new ClientResponseError({ status: 409, response: { message: 'Cette semaine a changé.' } })); const log = vi.spyOn(console, 'error').mockImplementation(() => {})
    try { await expect(createTimeService(r, { getSnapshot: () => session(['time.read']) }).week('2026-10-19')).rejects.toThrow('Cette semaine a changé.'); expect(log).toHaveBeenCalledWith('[time] Operation failed', { status: 409 }) } finally { log.mockRestore() }
  })
})
