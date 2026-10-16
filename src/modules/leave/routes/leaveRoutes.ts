import type { RouteObject } from 'react-router'
export const leaveRoutes: RouteObject[] = [
  { path: '/leave', lazy: async () => ({ Component: (await import('../pages/LeavePage')).LeavePage }) },
  { path: '/leave/:id', lazy: async () => ({ Component: (await import('../pages/LeaveRequestPage')).LeaveRequestPage }) },
]
