import type { RouteObject } from 'react-router'
export const calendarRoutes: RouteObject[] = [{ path: '/calendar', lazy: async () => ({ Component: (await import('../pages/CalendarPage')).CalendarPage }) }]
