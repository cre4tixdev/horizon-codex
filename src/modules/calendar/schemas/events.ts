import { z } from 'zod'
export const calendarKinds = { publication: 'Publication', submission: 'Remise', visit: 'Visite', hearing: 'Soutenance', result: 'Résultat attendu' }
export const calendarEventSchema = z.object({ id: z.string(), source_module: z.literal('crm'), source_entity: z.enum(['crm_opportunities', 'crm_tenders']), source_record_id: z.string(), kind: z.enum(['publication', 'submission', 'visit', 'hearing', 'result']), title: z.string(), code: z.string(), company: z.string(), start: z.iso.datetime(), end: z.iso.datetime().or(z.literal('')), all_day: z.boolean(), timezone: z.string(), location: z.string(), href: z.string().regex(/^\/crm\/(?:opportunities|tenders)\/[a-z0-9]{15}$/) })
export type CalendarEvent = z.infer<typeof calendarEventSchema>
export type CalendarQuery = { from: string; to: string; scope?: 'all' | 'tenders'; search?: string; archived?: boolean; company?: string; owner?: string; status?: string; preparationStatus?: string; tag?: string }

export const calendarPeriodSchema = z.object({ id: z.string(), source_record_id: z.string(), title: z.string(), code: z.string(), company: z.string(), href: z.string().regex(/^\/crm\/tenders\/[a-z0-9]{15}$/), start: z.iso.datetime().or(z.literal('')), end: z.iso.datetime().or(z.literal('')) })
export const calendarResponseSchema = z.object({ items: z.array(calendarEventSchema), periods: z.array(calendarPeriodSchema).default([]) })
export type CalendarSchedule = z.infer<typeof calendarResponseSchema>
