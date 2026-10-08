import { tenderSchema } from './tenders'
import { z } from 'zod'
import { tagToneSchema } from '../../../shared/schemas/tagTone'
import { richTextSchema } from '../../../shared/schemas/richText'
const identifier = z.string().regex(/^[a-z0-9]{15}$/, 'Choisissez une référence.')
export const opportunityStatuses = ['open', 'won', 'completed', 'lost', 'cancelled'] as const
export const statusLabels = { open: 'Ouverte', won: 'Gagnée', completed: 'Terminée', lost: 'Perdue', cancelled: 'Annulée' }
export const stageSchema = z.object({ id: identifier, code: z.string(), label: z.string(), sort_order: z.number(), tone: tagToneSchema, color: z.string().regex(/^#[0-9a-fA-F]{6}$/).or(z.literal('')).optional(), active: z.boolean(), status: z.enum(opportunityStatuses) })
export const ownerSchema = z.object({ id: identifier, name: z.string() })
export const opportunityInputSchema = z.object({
  type: z.enum(['direct', 'tender']).default('direct'),
  market_types: z.array(identifier).max(50).refine((ids) => new Set(ids).size === ids.length, 'Types de marché en double.').default([]), description_content: richTextSchema.nullable().default(null),
  title: z.string().trim().min(1, 'Renseignez un titre.').max(160), company: identifier, contact: z.union([identifier, z.literal('')]), owner: identifier, stage: identifier,
  estimated_value: z.number().min(0).max(999999999999), estimated_cost: z.number().min(0).max(999999999999), currency: z.string().regex(/^[A-Z]{3}$/), probability: z.number().int().min(0).max(100), expected_date: z.string().regex(/^$|^\d{4}-\d{2}-\d{2}$/, 'Date invalide.'), description: z.string().trim().max(10000), status: z.enum(opportunityStatuses),
})
export const opportunitySchema = opportunityInputSchema.extend({ id: identifier, collectionId: z.string(), opportunity_number: z.string(), analytic_account: identifier.or(z.literal('')), record_kind: z.enum(['opportunity', 'tender']).default('opportunity'), linked_updated: z.string().default(''), visit_count: z.number().default(0), document_count: z.number().default(0), estimated_margin: z.number(), type: z.enum(['direct', 'tender']), tender: tenderSchema.optional(), active: z.boolean(), created: z.string(), updated: z.string(), expected_date: z.string(), expand: z.object({ crm_tenders_via_opportunity: z.union([tenderSchema, z.array(tenderSchema)]).optional(), company: z.object({ id: z.string(), name: z.string(), collectionId: z.string(), logo: z.string().default('') }).optional(), contact: z.object({ id: z.string(), first_name: z.string(), last_name: z.string() }).optional(), owner: ownerSchema.optional(), stage: stageSchema.optional() }).optional() }).refine((record) => record.record_kind === 'tender' && record.tender && !record.tender.opportunity ? !record.analytic_account && !record.opportunity_number : Boolean(record.analytic_account && record.opportunity_number), 'Lien commercial incohérent.').transform((record) => ({ ...record, tender: record.tender || (Array.isArray(record.expand?.crm_tenders_via_opportunity) ? record.expand.crm_tenders_via_opportunity[0] : record.expand?.crm_tenders_via_opportunity) }))
export const opportunitiesPageSchema = z.object({ items: z.array(opportunitySchema), totalItems: z.number(), totalPages: z.number(), page: z.number() })
export type Opportunity = Omit<z.infer<typeof opportunitySchema>, 'tender'> & { tender?: z.infer<typeof tenderSchema> | undefined }
export type OpportunityInput = z.infer<typeof opportunityInputSchema>
export type Stage = z.infer<typeof stageSchema>
export type CrmListOptions = { search: string; page: number; archived: boolean; status: string; company: string; owner: string; sort: string; type?: string; preparation?: boolean; preparationStatus?: string; tag?: string }
export type StageChange = { id: string; stage: string; updated: string }
export { formatAmount } from '../../../shared/formatters/money'
export function opportunityDraft(record?: Opportunity): OpportunityInput { return record ? { type: record.type, market_types: record.market_types, description_content: record.description_content, title: record.title, company: record.company, contact: record.contact, owner: record.owner, stage: record.stage, estimated_value: record.estimated_value, estimated_cost: record.estimated_cost, currency: record.currency, probability: record.probability, expected_date: record.expected_date.slice(0, 10), description: record.description, status: record.status } : { type: 'direct', market_types: [], description_content: null, title: '', company: '', contact: '', owner: '', stage: '', estimated_value: 0, estimated_cost: 0, currency: 'EUR', probability: 0, expected_date: '', description: '', status: 'open' } }

export const crmRecordHref = (record: Opportunity) => `/crm/${record.record_kind === "tender" ? "tenders" : "opportunities"}/${record.id}`
