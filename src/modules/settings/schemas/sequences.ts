import { z } from 'zod'
const counter = z.number().int().min(1).max(999999999998)
const affix = z.string().max(20).refine((value) => !/[{}]/.test(value) && !Array.from(value).some((char) => char.charCodeAt(0) < 32 || char.charCodeAt(0) === 127), 'Caractères non autorisés.')
export const sequenceInputSchema = z.object({ start_value: counter, next_value: counter, prefix: affix, suffix: affix, padding: z.number().int().min(1).max(12) }).refine((value) => value.next_value >= value.start_value, 'Le prochain numéro doit être supérieur ou égal au départ.')
export const sequenceSchema = z.object({ id: z.string(), entity_type: z.string(), start_value: counter, next_value: z.number().int().min(1).max(999999999999), prefix: z.string(), suffix: z.string(), padding: z.number().int().min(1).max(12), has_issued: z.boolean(), active: z.boolean(), updated: z.string() })
export type NumberingSequence = z.infer<typeof sequenceSchema>
export type SequenceInput = z.infer<typeof sequenceInputSchema>
export function sequencePreview(value: SequenceInput) { return `${value.prefix}${String(value.next_value).padStart(Math.min(12, Math.max(1, value.padding || 1)), '0')}${value.suffix}` }
const labels: Record<string, string> = { crm_opportunities: 'Opportunités CRM', sales_quotes: 'Devis', sales_orders: 'Commandes clients', purchasing_orders: 'Commandes fournisseurs', billing_invoices: 'Factures', projects: 'Projets' }
export function sequenceLabel(entity: string) { return labels[entity] || entity }
