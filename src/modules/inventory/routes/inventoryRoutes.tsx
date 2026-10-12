import type { RouteObject } from 'react-router'
export const inventoryRoutes: RouteObject[] = [
  { path: '/inventory/assets', lazy: async () => ({ Component: (await import('../pages/InternalAssetsPage')).InternalAssetsPage }) },
  { path: '/inventory/assets/:id', lazy: async () => ({ Component: (await import('../pages/InternalAssetPage')).InternalAssetPage }) },
  { path: '/inventory/dashboard', lazy: async () => ({ Component: (await import('../pages/StockDashboardPage')).StockDashboardPage }) },
  { path: '/inventory/operations', lazy: async () => ({ Component: (await import('../pages/OperationsPage')).OperationsPage }) },
  { path: '/inventory/inventories', lazy: async () => ({ Component: (await import('../pages/OperationsPage')).OperationsPage }) },
  { path: '/inventory/operations/:id', lazy: async () => ({ Component: (await import('../pages/OperationPage')).OperationPage }) },
  { path: '/inventory/stock', lazy: async () => ({ Component: (await import('../pages/StockPage')).StockPage }) },
  { path: '/inventory', lazy: async () => ({ Component: (await import('../pages/ProductsPage')).ProductsPage }) },
  { path: '/inventory/products/:id', lazy: async () => ({ Component: (await import('../pages/ProductPage')).ProductPage }) },
]
