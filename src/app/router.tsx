import { createBrowserRouter } from 'react-router'
import { settingsRoutes } from '../modules/settings'
import { crmRoutes } from '../modules/crm'
import { hrRoutes } from '../modules/hr'
import { contactsRoutes } from '../modules/contacts'
import { dashboardRoutes } from '../modules/dashboard'
import { NotFoundPage } from './pages/NotFoundPage'
import { RouteErrorPage } from './pages/RouteErrorPage'
import { navigationItems } from './navigation'
import { WorkspacePage } from './pages/WorkspacePage'
import { RequireSession } from './components/RequireSession'

export const router = createBrowserRouter([
  { path: '/login', lazy: async () => ({ Component: (await import('./pages/LoginPage')).LoginPage }), hydrateFallbackElement: <p role="status">Chargement d’Horizon…</p>, errorElement: <RouteErrorPage /> },
  {
    element: <RequireSession />,
    hydrateFallbackElement: <p role="status">Chargement d’Horizon…</p>,
    children: [{
    lazy: async () => ({ Component: (await import('./components/AppFrame')).AppFrame }),
    errorElement: <RouteErrorPage />,
    children: [
      { path: '/account', lazy: async () => ({ Component: (await import('./pages/AccountPage')).AccountPage }) },
      ...dashboardRoutes,
      ...contactsRoutes,
      ...crmRoutes,
      ...hrRoutes,
      ...settingsRoutes,
      ...navigationItems.filter((item) => !['/', '/contacts', '/settings', '/crm', '/hr'].includes(item.href)).map((item) => ({ path: item.href, element: <WorkspacePage item={item} /> })),
      { path: '*', element: <NotFoundPage /> },
    ],
    }],
  },
])
