import { z } from 'zod'
const traceChoiceSchema = z.object({ updated: z.string(), lot: z.string(), serial: z.string(), number: z.string(), expiry_date: z.string(), status: z.string(), location: z.string(), physical: z.number(), reserved: z.number(), available: z.number() })
export const traceChoicesSchema = z.object({ tracking: z.enum(['none', 'lot', 'serial']), items: z.array(traceChoiceSchema) })
export type TraceChoice = z.infer<typeof traceChoiceSchema>
