import { z } from 'zod'
export const lookupFieldNames = ['name', 'legal_name', 'siren', 'siret', 'vat_number'] as const
export type LookupField = typeof lookupFieldNames[number]
export const lookupFieldLabels: Record<LookupField, string> = { name: 'Nom usuel', legal_name: 'Raison sociale', siren: 'SIREN', siret: 'SIRET', vat_number: 'Numéro de TVA' }
export const lookupFieldsSchema = z.object({ name: z.string().optional(), legal_name: z.string().optional(), siren: z.string().optional(), siret: z.string().optional(), vat_number: z.string().optional() })
export const lookupPreviewSchema = z.object({ fields: lookupFieldsSchema, vat_numbers: z.array(z.string()).optional(), address: z.object({ line1: z.string(), line2: z.string(), postal_code: z.string(), city: z.string(), country: z.string() }).nullable() })
export type LookupPreview = z.infer<typeof lookupPreviewSchema>
