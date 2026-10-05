import type { RouteObject } from 'react-router'
export const settingsRoutes: RouteObject[] = [{ path: '/settings', lazy: async () => ({ Component: (await import('../components/SettingsLayout')).SettingsLayout }), children: [
  { index: true, lazy: async () => ({ Component: (await import('../pages/SettingsPage')).SettingsPage }) },
  { path: 'references', lazy: async () => ({ Component: (await import('../pages/ReferencesPage')).ReferencesPage }) },
  { path: 'modules/:module', lazy: async () => ({ Component: (await import('../pages/SettingsModulePage')).SettingsModulePage }) },
] }]
