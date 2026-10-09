import { inventoryRoutes } from '../modules/inventory'
import { salesRoutes } from '../modules/sales'
import { documentsRoutes } from '../modules/documents'
import { calendarRoutes } from '../modules/calendar'
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
import { HLoadingIndicator } from '../shared/ui/HLoadingIndicator'

export const router = createBrowserRouter([
  { path: '/login', lazy: async () => ({ Component: (await import('./pages/LoginPage')).LoginPage }), hydrateFallbackElement: <HLoadingIndicator label="Chargement d’Horizon…" />, errorElement: <RouteErrorPage /> },
  {
    element: <RequireSession />,
    hydrateFallbackElement: <HLoadingIndicator label="Chargement d’Horizon…" />,
    children: [{
    lazy: async () => ({ Component: (await import('./components/AppFrame')).AppFrame }),
    errorElement: <RouteErrorPage />,
    children: [
      { path: '/account', lazy: async () => ({ Component: (await import('./pages/AccountPage')).AccountPage }) },
      ...dashboardRoutes,
      ...contactsRoutes,
      ...crmRoutes,
      ...salesRoutes,
      ...inventoryRoutes,
      ...documentsRoutes,
      ...calendarRoutes,
      ...hrRoutes,
      ...settingsRoutes,
      ...navigationItems.filter((item) => !['/', '/contacts', '/settings', '/crm', '/hr', '/calendar', '/sales', '/inventory'].includes(item.href)).map((item) => ({ path: item.href, element: <WorkspacePage item={item} /> })),
      { path: '*', element: <NotFoundPage /> },
    ],
    }],
  },
])
