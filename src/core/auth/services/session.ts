import { environment } from '../../config/environment'
import { queryClient } from '../../query/client'
import { createAuthRepository } from '../repositories/AuthRepository'
import { SessionService } from './SessionService'

export const isLayoutPreview = import.meta.env.DEV && !environment.pocketBaseUrl
export const sessionService = new SessionService(
  environment.pocketBaseUrl ? createAuthRepository(environment.pocketBaseUrl) : undefined,
  () => queryClient.clear(),
)
