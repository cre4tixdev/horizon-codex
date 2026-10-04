import { loginSchema, type LoginInput } from '../schemas/auth'
import type { AuthRepository } from '../repositories/AuthRepository'
import type { Session } from '../types/session'
import { AuthError } from './AuthError'

export class SessionService {
  private session: Session = { status: 'anonymous' }
  private listeners = new Set<() => void>()
  private generation = 0
  private pending = false
  constructor(private readonly repository: AuthRepository | undefined, private readonly clearData: () => void) {}
  getSnapshot = (): Session => this.session
  subscribe = (listener: () => void) => {
    this.listeners.add(listener)
    return () => { this.listeners.delete(listener) }
  }
  private publish(session: Session) {
    this.session = session
    this.listeners.forEach((listener) => listener())
  }
  async restore() {
    if (!this.repository?.hasSession() || this.pending) return
    const generation = ++this.generation
    this.pending = true
    try {
      const user = await this.repository.refresh()
      if (generation !== this.generation) { this.repository.signOut(); return }
      this.publish({ status: 'authenticated', user })
    } catch (error) {
      if (generation !== this.generation) return
      this.signOut()
      this.publish({ status: 'anonymous', error: error instanceof AuthError ? error.message : 'La vérification de votre session a échoué. Veuillez vous reconnecter.' })
    } finally { this.pending = false }
  }
  async signIn(input: LoginInput) {
    if (!this.repository) throw new AuthError('configuration')
    if (this.pending) throw new AuthError('unavailable')
    const parsed = loginSchema.parse(input)
    const generation = ++this.generation
    this.pending = true
    try {
      const user = await this.repository.signIn(parsed)
      if (generation !== this.generation) { this.repository.signOut(); return }
      this.clearData()
      this.publish({ status: 'authenticated', user })
    } catch (error) {
      this.repository.signOut()
      this.publish({ status: 'anonymous' })
      throw error
    } finally { this.pending = false }
  }
  async refresh() {
    if (!this.repository || this.pending || this.session.status !== 'authenticated') return
    const generation = this.generation
    this.pending = true
    try {
      const user = await this.repository.refresh()
      if (generation !== this.generation) { this.repository.signOut(); return }
      this.publish({ status: 'authenticated', user })
    } catch (error) {
      if (error instanceof AuthError && error.kind !== 'unavailable') this.signOut()
      throw error
    } finally { this.pending = false }
  }
  signOut = () => {
    this.generation++
    this.repository?.signOut()
    this.clearData()
    this.publish({ status: 'anonymous' })
  }
}
