import type { RouteObject } from 'react-router'
export const crmRoutes: RouteObject[] = [
  { path: '/crm', lazy: async () => ({ Component: (await import('../pages/CrmPage')).CrmPage }) },
  { path: '/crm/opportunities/:id', lazy: async () => ({ Component: (await import('../pages/OpportunityPage')).OpportunityPage }) },
]
