import { z } from 'zod'
export const fixedAnalyticSchema = z.object({ id: z.string(), updated: z.string(), key: z.enum(['stock', 'internal_asset', 'internal_consumable', 'internal_software', 'internal_service', 'internal_equipment', 'time_internal']), code: z.string(), label: z.string(), purpose: z.enum(['stock', 'consumption', 'internal', 'asset', 'time']) })
export const fixedAnalyticPageSchema = z.object({ items: z.array(fixedAnalyticSchema) })
export type FixedAnalytic = z.infer<typeof fixedAnalyticSchema>
export const fixedAnalyticInputSchema = fixedAnalyticSchema.pick({ id: true, updated: true, code: true, label: true }).extend({ code: z.string().regex(/^[0-9]{1,12}$/), label: z.string().trim().min(1).max(160) })
export type FixedAnalyticInput = z.infer<typeof fixedAnalyticInputSchema>

// Purchasing only accepts its own structural accounts.
export const purchaseFixedAnalyticSchema = fixedAnalyticSchema.extend({ key: fixedAnalyticSchema.shape.key.exclude(['time_internal']), purpose: fixedAnalyticSchema.shape.purpose.exclude(['time']) })
