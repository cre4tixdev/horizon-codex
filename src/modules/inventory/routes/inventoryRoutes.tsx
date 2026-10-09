import type { RouteObject } from 'react-router'
export const inventoryRoutes: RouteObject[] = [
  { path: '/inventory', lazy: async () => ({ Component: (await import('../pages/ProductsPage')).ProductsPage }) },
  { path: '/inventory/products/:id', lazy: async () => ({ Component: (await import('../pages/ProductPage')).ProductPage }) },
]
