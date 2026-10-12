import type { RouteObject } from 'react-router'
export const analysisRoutes: RouteObject[] = [
{ path: '/accounting/assets', lazy: async () => ({ Component: (await import('../pages/FixedAssetsPage')).FixedAssetsPage }) },
{ path: '/accounting/assets/:id', lazy: async () => ({ Component: (await import('../pages/FixedAssetPage')).FixedAssetPage }) },
{ path: '/analysis', lazy: async () => ({ Component: (await import('../pages/AnalysisPage')).AnalysisPage }) }, { path: '/analysis/:id', lazy: async () => ({ Component: (await import('../pages/AnalysisPage')).AnalysisPage }) }]
