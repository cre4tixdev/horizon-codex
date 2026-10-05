import { z } from 'zod'
export const catalogNames = ['settings_countries', 'settings_languages', 'accounting_currencies'] as const
export const catalogLabels = { settings_countries: 'Pays', settings_languages: 'Langues', accounting_currencies: 'Devises' }
export const referenceSchema = z.object({ id: z.string(), code: z.string(), label: z.string(), active: z.boolean(), sort_order: z.number(), minor_unit_digits: z.number().optional() })
export const referenceInputSchema = referenceSchema.omit({ id: true }).extend({ code: z.string().trim().min(1).max(35), label: z.string().trim().min(1).max(120), sort_order: z.number().int().min(0), minor_unit_digits: z.number().int().min(0).max(4).optional() })
