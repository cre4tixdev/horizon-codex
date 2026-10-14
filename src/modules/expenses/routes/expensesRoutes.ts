import type { RouteObject } from 'react-router'
export const expensesRoutes: RouteObject[] = [
  { path: '/expenses', lazy: async () => ({ Component: (await import('../pages/ExpensesPage')).ExpensesPage }) },
  { path: '/expenses/:id', lazy: async () => ({ Component: (await import('../pages/ExpenseReportPage')).ExpenseReportPage }) },
]
