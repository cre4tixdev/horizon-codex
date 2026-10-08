import { z } from 'zod'
export const crmSettingsSchema = z.object({ id: z.string(), code: z.literal('crm'), default_view: z.enum(['kanban', 'list', 'last']) })
export type CrmSettings = z.infer<typeof crmSettingsSchema>
