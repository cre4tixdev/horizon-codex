import type { RouteObject } from 'react-router'
export const crmRoutes: RouteObject[] = [
  { path: '/crm', lazy: async () => ({ Component: (await import('../pages/CrmPage')).CrmPage }) },
  { path: '/crm/tenders/:id', lazy: async () => ({ Component: (await import('../pages/OpportunityPage')).OpportunityPage }) },
  { path: '/crm/opportunities/:id', lazy: async () => ({ Component: (await import('../pages/OpportunityPage')).OpportunityPage }) },
]
