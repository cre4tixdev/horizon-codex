import type { RouteObject } from 'react-router'
export const salesRoutes: RouteObject[] = [
  { path: '/sales', lazy: async () => ({ Component: (await import('../pages/QuotesPage')).QuotesPage }) },
  { path: '/sales/quotes', lazy: async () => ({ Component: (await import('../pages/QuotesPage')).QuotesPage }) },
  { path: '/sales/quotes/:id', lazy: async () => ({ Component: (await import('../pages/QuotePage')).QuotePage }) },
]
