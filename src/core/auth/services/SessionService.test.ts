import { describe, expect, it, vi } from 'vitest'
import { SessionService } from './SessionService'
import { AuthError } from './AuthError'
import type { AuthRepository } from '../repositories/AuthRepository'
import { hasPermission, type HorizonUser } from '../types/session'
import { userSchema } from '../schemas/auth'

const user: HorizonUser = { id: 'user', email: 'test@local.invalid', name: 'Test', role: { id: 'role', label: 'Lecture', permissions: ['contacts.read'] } }
function setup() {
  const repository: AuthRepository = { hasSession: vi.fn(() => false), signIn: vi.fn(async () => user), refresh: vi.fn(async () => user), signOut: vi.fn() }
  const clear = vi.fn()
  return { service: new SessionService(repository, clear), repository, clear }
}
const input = { email: 'test@local.invalid', password: 'test-only' }

describe('session Horizon', () => {
  it('publie le compte authentifié et purge les données de la session précédente', async () => {
    const { service, clear } = setup()
    const listener = vi.fn()
    const unsubscribe = service.subscribe(listener)
    await service.signIn(input)
    expect(service.getSnapshot()).toEqual({ status: 'authenticated', user })
    expect(clear).toHaveBeenCalledOnce()
    expect(listener).toHaveBeenCalledOnce()
    unsubscribe()
    service.signOut()
    expect(listener).toHaveBeenCalledOnce()
    expect(service.getSnapshot()).toEqual({ status: 'anonymous' })
    expect(clear).toHaveBeenCalledTimes(2)
  })
  it('refuse une connexion sans configuration', async () => {
    await expect(new SessionService(undefined, vi.fn()).signIn(input)).rejects.toMatchObject({ kind: 'configuration' })
  })
  it('refuse une saisie invalide avant la requête serveur', async () => {
    const { service, repository } = setup()
    await expect(service.signIn({ ...input, email: 'invalid' })).rejects.toThrow()
    expect(repository.signIn).not.toHaveBeenCalled()
  })
  it('normalise l’e-mail sans modifier le mot de passe', async () => {
    const { service, repository } = setup()
    await service.signIn({ email: '  test@local.invalid  ', password: ' untouched ' })
    expect(repository.signIn).toHaveBeenCalledWith({ email: 'test@local.invalid', password: ' untouched ' })
  })
  it('supprime une session devenue interdite par le serveur', async () => {
    const { service, repository, clear } = setup()
    await service.signIn(input)
    vi.mocked(repository.refresh).mockRejectedValue(new AuthError('invalid-session'))
    await expect(service.refresh()).rejects.toThrow(AuthError)
    expect(service.getSnapshot()).toEqual({ status: 'anonymous' })
    expect(repository.signOut).toHaveBeenCalled()
    expect(clear).toHaveBeenCalledTimes(2)
  })
  it('signale une panne sans présenter le compte comme déconnecté', async () => {
    const { service, repository } = setup()
    await service.signIn(input)
    vi.mocked(repository.refresh).mockRejectedValue(new AuthError('unavailable'))
    await expect(service.refresh()).rejects.toMatchObject({ kind: 'unavailable' })
    expect(service.getSnapshot().status).toBe('authenticated')
  })
  it('une réponse tardive ne reconnecte pas après déconnexion', async () => {
    const { service, repository } = setup()
    let complete: ((user: HorizonUser) => void) | undefined
    vi.mocked(repository.signIn).mockImplementation(() => new Promise((resolve) => { complete = resolve }))
    const pending = service.signIn(input)
    service.signOut()
    complete?.(user)
    await pending
    expect(service.getSnapshot().status).toBe('anonymous')
    expect(repository.signOut).toHaveBeenCalledTimes(2)
  })
  it('restaure seulement après validation serveur du token stocké', async () => {
    const { service, repository } = setup()
    vi.mocked(repository.hasSession).mockReturnValue(true)
    let complete: ((user: HorizonUser) => void) | undefined
    vi.mocked(repository.refresh).mockImplementation(() => new Promise((resolve) => { complete = resolve }))
    const pending = service.restore()
    expect(service.getSnapshot().status).toBe('anonymous')
    complete?.(user)
    await pending
    expect(service.getSnapshot()).toEqual({ status: 'authenticated', user })
  })
  it.each(['invalid-session', 'unavailable'] as const)('refuse la restauration si le serveur échoue : %s', async (kind) => {
    const { service, repository } = setup()
    vi.mocked(repository.hasSession).mockReturnValue(true)
    vi.mocked(repository.refresh).mockRejectedValue(new AuthError(kind))
    await service.restore()
    expect(service.getSnapshot()).toEqual({ status: 'anonymous', error: new AuthError(kind).message })
    expect(repository.signOut).toHaveBeenCalledOnce()
  })
  it('ne reconnecte pas après une déconnexion pendant la restauration', async () => {
    const { service, repository } = setup()
    vi.mocked(repository.hasSession).mockReturnValue(true)
    let complete: ((user: HorizonUser) => void) | undefined
    vi.mocked(repository.refresh).mockImplementation(() => new Promise((resolve) => { complete = resolve }))
    const pending = service.restore()
    service.signOut()
    complete?.(user)
    await pending
    expect(service.getSnapshot().status).toBe('anonymous')
  })
  it('n’autorise que les permissions explicites', () => {
    expect(hasPermission(user, 'contacts.read')).toBe(true)
    expect(hasPermission(user, 'contacts.write')).toBe(false)
    expect(hasPermission(user, 'contacts')).toBe(false)
    expect(hasPermission(user, '*')).toBe(false)
  })
  it.each([
    { active: false }, { collectionName: '_superusers' }, { role: 'different' },
    { expand: { role: { id: 'role', name: 'reader', label: 'Lecture', active: false, permissions: [] } } },
    { expand: { role: { id: 'role', name: 'reader', label: 'Lecture', active: true, permissions: '*' } } },
  ])('refuse une session serveur incorrecte : %j', (override) => {
    const valid = { id: 'user', collectionName: 'core_users', email: input.email, name: 'Test', active: true, role: 'role',
      expand: { role: { id: 'role', name: 'reader', label: 'Lecture', active: true, permissions: [] } } }
    expect(userSchema.safeParse({ ...valid, ...override }).success).toBe(false)
  })
})
