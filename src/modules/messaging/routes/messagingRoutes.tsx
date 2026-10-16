import type { RouteObject } from 'react-router'
export const messagingRoutes: RouteObject[] = [{ path: '/messaging/oauth/callback', lazy: async () => ({ Component: (await import('../pages/MailOAuthCallbackPage')).MailOAuthCallbackPage }) }, { path: '/messaging', lazy: async () => ({ Component: (await import('../pages/MessagingPage')).MessagingPage }) }]
