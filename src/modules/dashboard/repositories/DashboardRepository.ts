import { createPocketBaseClient } from '../../../core/pocketbase/client'
import { dashboardActivitySchema, dashboardMetricsSchema, dashboardTasksSchema } from '../schemas/dashboard'
export function createDashboardRepository(url: string) {
  const client = createPocketBaseClient(url)
  return {
    async metrics(from: string, to: string) { return dashboardMetricsSchema.parse(await client.send('/api/horizon/dashboard/metrics', { method: 'GET', query: { from, to }, requestKey: null })) },
    async tasks(from: string, to: string) { return dashboardTasksSchema.parse(await client.send('/api/horizon/dashboard/tasks', { method: 'GET', query: { from, to }, requestKey: null })) },
    async activity() { return dashboardActivitySchema.parse(await client.send('/api/horizon/dashboard/activity', { method: 'GET', requestKey: null })) },
  }
}
