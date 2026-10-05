import { z } from 'zod'
import { createPocketBaseClient } from '../../pocketbase/client'
import { activityEventSchema, taskSchema, userChoiceSchema, type ActivityFilter, type ActivitySource, type Publication, type TaskStatus } from '../types/activity'
export function createActivityRepository(url: string) {
  const client = createPocketBaseClient(url)
  const filter = (source: ActivitySource) => client.filter('source_module = "contacts" && source_entity = {:entity} && source_record_id = {:id}', source)
  return {
    async list(source: ActivitySource, page: number, category: ActivityFilter) {
      const type = category === 'changes' ? ' && (type = "change" || type = "status_change")' : category === 'comments' ? ' && (type = "note" || type = "message")' : category === 'documents' ? ' && attachments:length > 0' : category === 'tasks' ? ' && type = "task"' : ''
      return z.object({ items: z.array(activityEventSchema), totalItems: z.number(), totalPages: z.number(), page: z.number() }).parse(await client.collection('core_activity_events').getList(page, 20, { filter: filter(source) + type, sort: '-created,-id', requestKey: null }))
    },
    async users(query: string) { return z.object({ items: z.array(userChoiceSchema) }).parse(await client.send('/api/horizon/activity/users', { method: 'GET', query: { q: query }, requestKey: null })).items },
    async publish(source: ActivitySource, input: Publication, files: File[]) {
      const data = new FormData()
      for (const [key, value] of Object.entries({ source_module: 'contacts', source_entity: source.entity, source_record_id: source.id, body: input.body, type: input.type, mentions: JSON.stringify(input.mentions), metadata: JSON.stringify({ task: input.task, origin_event: input.origin_event }) })) data.set(key, value)
      files.forEach((file) => data.append('attachments', file))
      return activityEventSchema.parse(await client.collection('core_activity_events').create(data))
    },
    async tasks(source: ActivitySource) { return z.array(taskSchema).parse(await client.collection('core_tasks').getFullList({ filter: filter(source), sort: 'created,id', requestKey: null })) },
    async updateTask(id: string, change: { status?: TaskStatus; assigned_to?: string; due_date?: string; priority?: ActivityTaskPriority }) { return taskSchema.parse(await client.collection('core_tasks').update(id, change)) },
    async attachmentURL(collectionId: string, id: string, filename: string) { const token = await client.files.getToken({ requestKey: null }); return client.files.getURL({ collectionId, id }, filename, { token }) },
  }
}
type ActivityTaskPriority = 'low' | 'normal' | 'high'
