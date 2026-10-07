import { z } from 'zod'
export const activitySourceSchema = z.object({ entity: z.enum(['contacts_companies', 'contacts_people', 'crm_opportunities']), id: z.string().regex(/^[a-z0-9]{15}$/) })
export type ActivitySource = z.infer<typeof activitySourceSchema>
export const userChoiceSchema = z.object({ id: z.string(), name: z.string(), initials: z.string() })
export type ActivityUser = z.infer<typeof userChoiceSchema>
export const activityEventSchema = z.object({ id: z.string(), collectionId: z.string(), type: z.enum(['change', 'status_change', 'note', 'message', 'document', 'task', 'system']), author: z.string(), body: z.string(), created: z.string(), attachments: z.array(z.string()), metadata: z.object({
  author: z.object({ name: z.string(), initials: z.string() }), action: z.string().optional(), changes: z.array(z.object({ field: z.string(), label: z.string(), before: z.union([z.string(), z.boolean()]), after: z.union([z.string(), z.boolean()]) })).optional(), mentions: z.array(z.object({ id: z.string(), name: z.string() })).optional(), origin_event: z.string().optional(), task_id: z.string().optional(),
}) })
export type ActivityEvent = z.infer<typeof activityEventSchema>
export const taskStatusSchema = z.enum(['todo', 'in_progress', 'blocked', 'done', 'cancelled'])
export type TaskStatus = z.infer<typeof taskStatusSchema>
export const taskSchema = z.object({ id: z.string(), title: z.string(), assigned_to: z.string(), assigned_name: z.string(), due_date: z.string(), status: taskStatusSchema, priority: z.enum(['low', 'normal', 'high']), activity_event: z.string() })
export type ActivityTask = z.infer<typeof taskSchema>
export type ActivityFilter = 'all' | 'changes' | 'comments' | 'documents' | 'tasks'
export const publicationSchema = z.object({ body: z.string().trim().max(10000), type: z.enum(['note', 'task']), mentions: z.array(z.string().regex(/^[a-z0-9]{15}$/)).max(10), origin_event: z.string().optional(), task: z.object({ title: z.string().trim().min(1, 'Renseignez un titre.').max(160), assigned_to: z.string().regex(/^[a-z0-9]{15}$/, 'Choisissez un responsable.'), due_date: z.string().regex(/^$|^\d{4}-\d{2}-\d{2}$/), priority: z.enum(['low', 'normal', 'high']) }).optional() })
export type Publication = z.infer<typeof publicationSchema>
