import { beforeEach, expect, it, vi } from 'vitest'
const { send } = vi.hoisted(() => ({ send: vi.fn() }))
vi.mock('../../../core/pocketbase/client', () => ({ createPocketBaseClient: () => ({ send }) }))
import { createHrRepository, HrConfigurationError } from './HrRepository'
beforeEach(() => send.mockReset())
it.each([undefined, 'none', 'be'])('ne confirme la sauvegarde BE que si le serveur le retourne : %s', async (returned) => {
  send.mockResolvedValue({ id: 'team', updated: 'version', name: 'Études', managers: [], active: true, ...(returned ? { time_work_type: returned } : {}) })
  const saved = createHrRepository('http://local.invalid').team('Études', [], true, undefined, 'be')
  if (returned === 'be') await expect(saved).resolves.toMatchObject({ time_work_type: 'be' })
  else await expect(saved).rejects.toBeInstanceOf(HrConfigurationError)
  expect(send).toHaveBeenCalledWith('/api/horizon/hr/teams/save', expect.objectContaining({ body: expect.objectContaining({ time_work_type: 'be' }) }))
})
