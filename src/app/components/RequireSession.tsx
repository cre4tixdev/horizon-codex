import { useSyncExternalStore } from 'react'
import { Navigate, Outlet, useLocation } from 'react-router'
import { isLayoutPreview, sessionService } from '../../core/auth/services/session'

export function RequireSession() {
  const session = useSyncExternalStore(sessionService.subscribe, sessionService.getSnapshot)
  const location = useLocation()
  if (isLayoutPreview || session.status === 'authenticated') return <Outlet />
  return <Navigate to="/login" replace state={{ returnTo: location.pathname + location.search }} />
}
