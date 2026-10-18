import { redirect, type RouteObject } from 'react-router'
export const importsRoutes: RouteObject[] = [
  { path: '/settings/imports', lazy: async () => ({ Component: (await import('../pages/ImportsPage')).ImportsPage }) },
  { path: '/contacts/import', Component: () => null, loader: ({ request }) => redirect(`/settings/imports${new URL(request.url).search}`) },
]
