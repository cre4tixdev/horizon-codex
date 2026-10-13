import { z } from 'zod'
export const paymentTermSchema = z.object({ id: z.string(), code: z.string(), label: z.string(), description: z.string(), days: z.number().int().min(0).max(365), active: z.boolean() })
export const paymentTermsSchema = z.object({ items: z.array(paymentTermSchema), default_id: z.string() })
export type PaymentTerm = z.infer<typeof paymentTermSchema>
