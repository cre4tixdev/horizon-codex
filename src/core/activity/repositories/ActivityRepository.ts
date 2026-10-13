import { ClientResponseError } from 'pocketbase'
import { z } from 'zod'
import { createPocketBaseClient } from '../../pocketbase/client'
import { activityEventSchema, taskSchema, userChoiceSchema, type ActivityFilter, type ActivitySource, type Publication, type TaskStatus } from '../types/activity'
export function createActivityRepository(url: string) {
  const client = createPocketBaseClient(url)
  return {
    async avatar(id: string) {
      const response = await fetch(client.buildURL(`/api/horizon/activity/events/${id}/avatar`), { headers: { Authorization: client.authStore.token }, cache: 'no-store' })
      if (!response.ok) throw new ClientResponseError({ status: response.status })
      return response.status === 204 ? null : response.blob()
    },
    async list(source: ActivitySource, page: number, category: ActivityFilter) {
      return z.object({ items: z.array(activityEventSchema), totalItems: z.number(), totalPages: z.number(), page: z.number() }).parse(await client.send('/api/horizon/activity/events', { method: 'GET', query: { ...source, page, category }, requestKey: null }))
    },
    async users(query: string, source?: ActivitySource) { return z.object({ items: z.array(userChoiceSchema) }).parse(await client.send('/api/horizon/activity/users', { method: 'GET', query: { q: query, module: source?.entity.startsWith('billing_') ? 'billing' : source?.entity.startsWith('purchasing_') ? 'purchasing' : source?.entity.startsWith('inventory_') ? 'inventory' : source?.entity.startsWith('sales_') ? 'sales' : source?.entity.startsWith('crm_') ? 'crm' : 'contacts' }, requestKey: null })).items },
    async publish(source: ActivitySource, input: Publication, files: File[]) {
      const data = new FormData()
      for (const [key, value] of Object.entries({ source_module: source.entity.startsWith('billing_') ? 'billing' : source.entity.startsWith('purchasing_') ? 'purchasing' : source.entity.startsWith('inventory_') ? 'inventory' : source.entity.startsWith('sales_') ? 'sales' : source.entity.startsWith('crm_') ? 'crm' : 'contacts', source_entity: source.entity, source_record_id: source.id, body: input.body, type: input.type, mentions: JSON.stringify(input.mentions), metadata: JSON.stringify({ task: input.task, origin_event: input.origin_event }) })) data.set(key, value)
      files.forEach((file) => data.append('attachments', file))
      return activityEventSchema.parse(await client.collection('core_activity_events').create(data))
    },
    async tasks(source: ActivitySource) { return z.object({ items: z.array(taskSchema) }).parse(await client.send('/api/horizon/activity/tasks', { method: 'GET', query: source, requestKey: null })).items },
    async updateTask(id: string, change: { status?: TaskStatus; assigned_to?: string; due_date?: string; priority?: ActivityTaskPriority }) { return taskSchema.parse(await client.collection('core_tasks').update(id, change)) },
    async attachmentURL(collectionId: string, id: string, filename: string) { const token = await client.files.getToken({ requestKey: null }); return client.files.getURL({ collectionId, id }, filename, { token }) },
    async removeAttachment(id: string, filename: string) { return activityEventSchema.parse(await client.send('/api/horizon/activity/attachments/delete', { method: 'POST', body: { event_id: id, filename } })) },
  }
}
type ActivityTaskPriority = 'low' | 'normal' | 'high'
