import { z } from 'zod'
export const valuationMethods = { standard: 'Coût standard', cump: 'CUMP', fifo: 'FIFO' } as const
export const valuationMethodSchema = z.enum(['standard', 'cump', 'fifo'])
export const valuationProductSchema = z.object({ product: z.string(), name: z.string(), reference: z.string(), brand: z.string(), standard_cost: z.number().nullable(), updated: z.string(), quantity: z.number(), physical_quantity: z.number(), value: z.number(), opening_required: z.boolean(), unit: z.string() })
export const valuationPageSchema = z.object({ method: valuationMethodSchema, currency: z.string(), value: z.number(), transit_value: z.number(), incomplete: z.number(), settings_updated: z.string(), items: z.array(valuationProductSchema), page: z.number(), totalPages: z.number() })
export const valuationHistorySchema = z.object({ items: z.array(z.object({ id: z.string(), created: z.string(), method: valuationMethodSchema, quantity: z.number(), movement_value: z.number(), value_delta: z.number(), actual_value: z.number().nullable(), variance: z.number().nullable(), actual_known: z.boolean(), reason: z.string(), currency: z.string() })) })
export type ValuationProduct = z.infer<typeof valuationProductSchema>
export type ValuationMethod = z.infer<typeof valuationMethodSchema>
export type ValuationCostInput = { product: string; updated: string; standard_cost: number; opening: boolean; reason: string }
export type ValuationMethodInput = { method: ValuationMethod; updated: string; reason: string }
