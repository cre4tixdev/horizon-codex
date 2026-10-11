import type { RouteObject } from 'react-router'
export const purchasingRoutes: RouteObject[] = [
  { path: '/purchasing', lazy: async () => ({ Component: (await import('../pages/PurchasesPage')).PurchasesPage }) },
  { path: '/purchasing/:kind', lazy: async () => ({ Component: (await import('../pages/PurchasesPage')).PurchasesPage }) },
  { path: '/purchasing/:kind/:id', lazy: async () => ({ Component: (await import('../pages/PurchasePage')).PurchasePage }) },
]
