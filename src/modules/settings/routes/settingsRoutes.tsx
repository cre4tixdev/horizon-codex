import { redirect, type RouteObject } from 'react-router'
export const settingsRoutes: RouteObject[] = [{ path: '/settings', lazy: async () => ({ Component: (await import('../components/SettingsLayout')).SettingsLayout }), children: [
  { index: true, lazy: async () => ({ Component: (await import('../pages/SettingsPage')).SettingsPage }) },
  { path: 'crm', lazy: async () => ({ Component: (await import('../pages/CrmSettingsPage')).CrmSettingsPage }) },
  { path: 'sequences', lazy: async () => ({ Component: (await import('../pages/SequencesPage')).SequencesPage }) },
  { path: 'users', lazy: async () => ({ Component: (await import('../pages/UsersAccessPage')).UsersAccessPage }) },
  { path: 'modules/securite', loader: () => redirect('/settings/users') },
  { path: 'references', lazy: async () => ({ Component: (await import('../pages/ReferencesPage')).ReferencesPage }) },
  { path: 'modules/:module', lazy: async () => ({ Component: (await import('../pages/SettingsModulePage')).SettingsModulePage }) },
] }]
