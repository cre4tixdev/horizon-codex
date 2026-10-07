import { z } from 'zod'
import { tagToneSchema } from '../../../shared/schemas/tagTone'
export const catalogNames = ['settings_countries', 'settings_languages', 'accounting_currencies', 'crm_stages', 'crm_market_types', 'settings_identity_tags'] as const
export const catalogLabels = { settings_countries: 'Pays', settings_languages: 'Langues', accounting_currencies: 'Devises', crm_stages: 'Étapes CRM', crm_market_types: 'Types de marché', settings_identity_tags: 'Tags utilisateurs' }
export const referenceSchema = z.object({ id: z.string(), code: z.string(), label: z.string(), active: z.boolean(), sort_order: z.number(), minor_unit_digits: z.number().optional(), status: z.enum(['open', 'won', 'completed', 'lost', 'cancelled']).optional(), tone: tagToneSchema.optional(), color: z.string().regex(/^#[0-9a-fA-F]{6}$/).or(z.literal('')).optional() })
export const referenceInputSchema = referenceSchema.omit({ id: true }).extend({ code: z.string().trim().min(1).max(35), label: z.string().trim().min(1).max(120), sort_order: z.number().int().min(0), minor_unit_digits: z.number().int().min(0).max(4).optional() })
