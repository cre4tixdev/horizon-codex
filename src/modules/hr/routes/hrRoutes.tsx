import type { RouteObject } from 'react-router'
export const hrRoutes: RouteObject[] = [{ path: '/hr', lazy: async () => ({ Component: (await import('../pages/EmployeesPage')).EmployeesPage }) }]
