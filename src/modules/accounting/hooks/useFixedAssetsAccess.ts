import { useSyncExternalStore } from 'react'
import { sessionService } from '../../../core/auth/services/session'
import { fixedAssetsAccess } from '../services/FixedAssetsService'
export function useFixedAssetsAccess() { useSyncExternalStore(sessionService.subscribe, sessionService.getSnapshot); return fixedAssetsAccess() }
