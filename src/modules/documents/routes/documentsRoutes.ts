import type { RouteObject } from 'react-router'
export const documentsRoutes: RouteObject[] = [{ path: '/settings/documents/:id', lazy: async () => ({ Component: (await import('../pages/StudioPage')).StudioPage }) }]
