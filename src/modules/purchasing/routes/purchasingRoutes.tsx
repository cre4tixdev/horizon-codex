import { redirect, type RouteObject } from 'react-router'
export const purchasingRoutes: RouteObject[] = [
  { path: '/purchasing', lazy: async () => ({ Component: (await import('../pages/PurchasesPage')).PurchasesPage }), loader: ({ request }) => { const params = new URL(request.url).searchParams; if (params.has('status')) return null; params.set('status', 'pending'); return redirect(`/purchasing?${params}`) } },
  { path: '/purchasing/:kind', lazy: async () => ({ Component: (await import('../pages/PurchasesPage')).PurchasesPage }) },
  { path: '/purchasing/:kind/:id', lazy: async () => ({ Component: (await import('../pages/PurchasePage')).PurchasePage }) },
]
