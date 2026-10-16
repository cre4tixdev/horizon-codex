export const activityRoutes = [{ path: '/activity', lazy: async () => ({ Component: (await import('./pages/ActivityPage')).ActivityPage }) }]
