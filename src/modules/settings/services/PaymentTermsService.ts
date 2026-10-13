import { ClientResponseError } from 'pocketbase'
import { environment } from '../../../core/config/environment'
import { sessionService } from '../../../core/auth/services/session'
import { hasPermission } from '../../../core/auth/types/session'
import { createPaymentTermsRepository } from '../repositories/PaymentTermsRepository'
const repository = environment.pocketBaseUrl ? createPaymentTermsRepository(environment.pocketBaseUrl) : undefined
export const paymentTermsService = { async list() {
  const session = sessionService.getSnapshot()
  if (!repository || session.status !== 'authenticated' || !['contacts.read', 'billing.read'].some((right) => hasPermission(session.user, right))) throw new Error('Accès aux conditions de paiement refusé.')
  try { return await repository.list() } catch (error) { console.error('[settings] Payment terms unavailable', { status: error instanceof ClientResponseError ? error.status : 0 }); throw new Error('Conditions de paiement indisponibles. Réessayez.', { cause: error }) }
} }
