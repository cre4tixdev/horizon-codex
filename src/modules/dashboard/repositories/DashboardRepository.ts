import { createPocketBaseClient } from '../../../core/pocketbase/client'
import { dashboardActivitySchema, dashboardMetricsSchema, dashboardTasksSchema } from '../schemas/dashboard'
import { dashboardLayoutsSchema, type DashboardPreference } from '../schemas/layouts'
export function createDashboardRepository(url: string) {
  const client = createPocketBaseClient(url)
  return {
    async layouts() { return dashboardLayoutsSchema.parse(await client.send('/api/horizon/dashboard/layouts', { method: 'GET', requestKey: null })) },
    async saveLayouts(revision: number, preference: DashboardPreference) { return dashboardLayoutsSchema.parse(await client.send('/api/horizon/dashboard/layouts', { method: 'POST', body: { revision, preference }, requestKey: null })) },
    async metrics(from: string, to: string) { return dashboardMetricsSchema.parse(await client.send('/api/horizon/dashboard/metrics', { method: 'GET', query: { from, to }, requestKey: null })) },
    async tasks(from: string, to: string) { return dashboardTasksSchema.parse(await client.send('/api/horizon/dashboard/tasks', { method: 'GET', query: { from, to }, requestKey: null })) },
    async activity() { return dashboardActivitySchema.parse(await client.send('/api/horizon/dashboard/activity', { method: 'GET', requestKey: null })) },
  }
}
