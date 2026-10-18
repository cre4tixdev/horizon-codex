import type { RouteObject } from 'react-router'
export const qualityRoutes: RouteObject[] = [{ path: '/settings/data-quality', lazy: async () => ({ Component: (await import('../pages/QualityPage')).QualityPage }) }]
