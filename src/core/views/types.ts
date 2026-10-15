import { z } from 'zod'

export const viewParamsSchema = z.object({
  q: z.string().max(200).optional(), state: z.enum(['active', 'archived']).optional(),
  role: z.enum(['all', 'customer', 'supplier']).optional(), group: z.enum(['none', 'country', 'company']).optional(),
  sort: z.enum(['name:asc', 'name:desc', 'last_name:asc', 'last_name:desc', 'email:asc', 'email:desc', 'legal_name:asc', 'legal_name:desc', 'phone:asc', 'phone:desc', 'company:asc', 'company:desc', 'roles:asc', 'roles:desc', 'status:asc', 'status:desc', 'job_title:asc', 'job_title:desc']).optional(),
  view: z.enum(['cards', 'list']).optional(),
}).strict()
export const savedViewInputSchema = z.object({ name: z.string().trim().min(1, 'Saisissez un nom.').max(80), context: z.enum(['contacts.companies', 'contacts.people']), visibility: z.enum(['personal', 'shared']), params: viewParamsSchema }).superRefine((input, ctx) => {
  if (input.context === 'contacts.companies' && (input.params.group === 'company' || ['last_name', 'company', 'job_title'].includes(input.params.sort?.split(':')[0] || ''))) ctx.addIssue({ code: 'custom', path: ['params'], message: 'Critères incompatibles avec les sociétés.' })
  if (input.context === 'contacts.people' && input.params.sort && !['last_name:asc', 'last_name:desc', 'email:asc', 'email:desc', 'phone:asc', 'phone:desc', 'company:asc', 'company:desc', 'roles:asc', 'roles:desc', 'status:asc', 'status:desc', 'job_title:asc', 'job_title:desc'].includes(input.params.sort)) ctx.addIssue({ code: 'custom', path: ['params'], message: 'Tri incompatible avec les personnes.' })
})
export const savedViewSchema = z.object({ id: z.string(), name: z.string(), context: z.enum(['contacts.companies', 'contacts.people']), visibility: z.enum(['personal', 'shared']), owner: z.string(), params: viewParamsSchema, updated: z.string() })
export type SavedView = z.infer<typeof savedViewSchema>
export type SavedViewInput = z.infer<typeof savedViewInputSchema>
export type ViewContext = SavedView['context']
