import { ClientResponseError } from 'pocketbase'
import { environment } from '../../config/environment'
import { createAccountRepository } from '../repositories/AccountRepository'
import { accountInputSchema, passwordInputSchema, type AccountInput, type PasswordInput, type Presence, presenceSchema } from '../schemas/account'
import { sessionService } from './session'
const repository = environment.pocketBaseUrl ? createAccountRepository(environment.pocketBaseUrl) : undefined
async function run<T>(work: (repo: NonNullable<typeof repository>) => Promise<T>): Promise<T> {
  if (!repository || sessionService.getSnapshot().status !== 'authenticated') throw new Error('Connectez-vous pour accéder à votre compte.')
  try { return await work(repository) } catch (error) {
    const status = error instanceof ClientResponseError ? error.status : 0
    console.error('[account] Operation failed', { status })
    if (status === 409) throw new Error('Votre profil a changé. Actualisez la page avant de réessayer.', { cause: error })
    if (status === 400) throw new Error(error instanceof ClientResponseError && typeof error.response.message === 'string' ? error.response.message : 'Vérifiez les informations saisies.', { cause: error })
    if (status === 401 || status === 403) throw new Error('Votre session ne permet plus cette action. Reconnectez-vous.', { cause: error })
    throw new Error('Votre compte est indisponible. Réessayez.', { cause: error })
  }
}
export const accountService = {
  read: () => run((repo) => repo.read()),
  avatar: (id: string) => run((repo) => repo.avatar(id)),
  async save(input: AccountInput, updated: string) {
    const value = accountInputSchema.parse(input)
    const saved = await run((repo) => repo.save(value, updated))
    await sessionService.refresh(); return saved
  },
  async presence(presence: Presence) { const saved = await run((repo) => repo.presence(presenceSchema.parse(presence))); await sessionService.refresh(); return saved },
  async password(input: PasswordInput) { const value = passwordInputSchema.parse(input); await run((repo) => repo.password(value)); sessionService.signOut() },
}
