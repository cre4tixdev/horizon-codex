import { z } from 'zod'
const workHours = z.object({ planned_minutes: z.number().int().nonnegative(), actual_minutes: z.number().int().nonnegative(), pending_minutes: z.number().int().nonnegative() })
const hours = z.object({ be: workHours, production: workHours })
const financial = z.object({ estimated_revenue: z.number().optional(), revenue: z.number(), planned_cost: z.number(), planned_margin: z.number(), planned_margin_percent: z.number().nullable(), purchases_committed: z.number(), stock_consumed: z.number().nullable() })
export const analysisAccountSchema = z.object({ id: z.string(), code: z.string(), label: z.string(), quote: z.string(), confirmed: z.boolean(), item_lines: z.number(), delivered_lines: z.number(), hours, financial: financial.optional() })
export const analysisSchema = z.object({ root: z.object({ id: z.string(), code: z.string(), opportunity: z.string(), label: z.string(), client: z.string() }), currency: z.string(), capabilities: z.object({ financial: z.boolean(), labor_costs: z.boolean(), scope: z.string() }), accounts: z.array(analysisAccountSchema), totals: analysisAccountSchema, coverage: z.object({ planning: z.boolean(), time: z.boolean(), expenses: z.boolean(), billing: z.boolean(), labor_costs: z.boolean(), stock_currency_mismatch: z.boolean() }) })
export type Analysis = z.infer<typeof analysisSchema>
export type AnalysisAccount = z.infer<typeof analysisAccountSchema>

export const analysisPageSchema = z.object({ items: z.array(analysisSchema), page: z.number(), totalItems: z.number(), totalPages: z.number() })
