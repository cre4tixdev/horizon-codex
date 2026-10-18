import type { RouteObject } from 'react-router'
export const timeRoutes: RouteObject[] = [
  { path: '/time-reporting', lazy: async () => ({ Component: (await import('../pages/TimePage')).TimePage }) },
  { path: '/time-reporting/sheets/:id', lazy: async () => ({ Component: (await import('../pages/TimeSheetPage')).TimeSheetPage }) },
]
