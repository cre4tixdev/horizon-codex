import { z } from 'zod'

export const sources = { opportunities: 'Opportunités', quotes: 'Devis', orders: 'Commandes clients', invoices: 'Factures clients' } as const
export const sourceSchema = z.enum(['opportunities', 'quotes', 'orders', 'invoices'])
export const sourceStates = {
  opportunities: { open: 'Ouverte', won: 'Gagnée', completed: 'Terminée', lost: 'Perdue', cancelled: 'Annulée' },
  quotes: { draft: 'Brouillon', validated: 'Finalisé', sent: 'Envoyé', rejected: 'Refusé', cancelled: 'Annulé' },
  orders: { confirmed: 'Confirmée', in_progress: 'En cours', completed: 'Terminée' },
  invoices: { draft: 'Brouillon', validated: 'Validée', unpaid: 'À régler', overdue: 'En retard', cancelled: 'Annulée' },
} as const
export const widgetPeriodSchema = z.enum(['dashboard', 'month', 'quarter', 'year', 'all'])
const title = z.string().trim().max(80).refine((value) => [...value].every((character) => character.charCodeAt(0) >= 32 && character.charCodeAt(0) !== 127))
export const dataSpecSchema = z.object({
  title: title.default(''), source: sourceSchema.default('opportunities'),
  scope: z.enum(['own', 'accessible']).default('accessible'), status: z.string().max(30).default(''),
  search: z.string().trim().max(200).default(''), company: z.string().regex(/^([a-z0-9]{15})?$/).default(''), companyLabel: z.string().trim().max(200).default(''),
  period: widgetPeriodSchema.default('all'), presentation: z.enum(['list', 'table', 'count']).default('list'), limit: z.number().int().min(3).max(20).default(7),
}).strict().refine((value) => (!value.status || Object.hasOwn(sourceStates[value.source], value.status)) && !(value.source === 'invoices' && value.scope === 'own'), 'Les filtres doivent correspondre à la source de données.')
export type WidgetDataSpec = z.infer<typeof dataSpecSchema>
export const defaultPages = [dataSpecSchema.parse({ title: 'Opportunités', source: 'opportunities' }), dataSpecSchema.parse({ title: 'Devis', source: 'quotes' }), dataSpecSchema.parse({ title: 'Commandes clients', source: 'orders' }), dataSpecSchema.parse({ title: 'Factures', source: 'invoices' })]
export const widgetConfigSchema = z.object({
  title: title.default(''), period: widgetPeriodSchema.default('dashboard'),
  data: dataSpecSchema.default(() => dataSpecSchema.parse({})),
  pages: z.array(dataSpecSchema).min(1).max(12).default(() => defaultPages.map((page) => ({ ...page }))),
  automatic: z.boolean().default(true), interval: z.number().int().min(5).max(120).default(10),
  scope: z.enum(['own', 'team', 'company']).default('own'),
  links: z.array(z.enum(['crm', 'quotes', 'orders', 'billing', 'time', 'leave', 'expenses', 'documents', 'calendar'])).max(9).default(['crm', 'quotes', 'calendar']).refine((items) => new Set(items).size === items.length),
}).strict()
export type WidgetConfig = z.infer<typeof widgetConfigSchema>
