import { ClientResponseError } from 'pocketbase'
import { environment } from '../../../core/config/environment'
import { sessionService } from '../../../core/auth/services/session'
import { hasPermission } from '../../../core/auth/types/session'
import { createFixedAnalyticRepository } from '../repositories/FixedAnalyticRepository'
import { fixedAnalyticInputSchema, type FixedAnalyticInput } from '../schemas/fixedAnalytic'
const repository = environment.pocketBaseUrl ? createFixedAnalyticRepository(environment.pocketBaseUrl) : undefined
async function run<T>(fn: (repo: ReturnType<typeof createFixedAnalyticRepository>) => Promise<T>) {
  const session = sessionService.getSnapshot()
  if (!repository || session.status !== 'authenticated' || !hasPermission(session.user, 'settings.references')) throw new Error('Accès au paramétrage des codes analytiques refusé.')
  try { return await fn(repository) } catch (error) { console.error('[fixed-analytic] Operation failed', { status: error instanceof ClientResponseError ? error.status : 0 }); throw new Error(error instanceof ClientResponseError && [400, 403, 404, 409].includes(error.status) ? error.response.message : 'Paramètres analytiques indisponibles. Réessayez.', { cause: error }) }
}
export const fixedAnalyticService = { read: () => run((repo) => repo.read()), save: (items: FixedAnalyticInput[]) => run((repo) => repo.save(items.map((item) => fixedAnalyticInputSchema.parse(item)))) }
