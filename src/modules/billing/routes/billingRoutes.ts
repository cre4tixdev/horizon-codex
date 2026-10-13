import type { RouteObject } from 'react-router'
export const billingRoutes: RouteObject[] = [
  { path: '/billing', lazy: async () => ({ Component: (await import('../pages/BillingDashboardPage')).BillingDashboardPage }) },
  { path: '/billing/payments', lazy: async () => ({ Component: (await import('../pages/PaymentsPage')).PaymentsPage }) },
  { path: '/billing/credits', lazy: async () => ({ Component: (await import('../pages/BillsPage')).BillsPage }) },
  { path: '/billing/:kind', lazy: async () => ({ Component: (await import('../pages/BillsPage')).BillsPage }) },
  { path: '/billing/:kind/:id', lazy: async () => ({ Component: (await import('../pages/BillPage')).BillPage }) },
]
