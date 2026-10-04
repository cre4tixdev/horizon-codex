import type { RouteObject } from 'react-router'
export const contactsRoutes: RouteObject[] = [
  { path: '/contacts', lazy: async () => ({ Component: (await import('../pages/ContactsPage')).ContactsPage }) },
  { path: '/contacts/people', lazy: async () => ({ Component: (await import('../pages/ContactsPage')).PeoplePage }) },
  { path: '/contacts/companies/:id', lazy: async () => ({ Component: (await import('../pages/ContactPage')).CompanyPage }) },
  { path: '/contacts/people/:id', lazy: async () => ({ Component: (await import('../pages/ContactPage')).PersonPage }) },
]
