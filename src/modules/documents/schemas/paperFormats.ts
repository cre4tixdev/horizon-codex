import { z } from 'zod'
const dimension = z.number().min(10).max(1000).refine((value) => Math.abs(value * 100 - Math.round(value * 100)) < 0.00001, 'Deux décimales maximum.')
export const paperFormatInputSchema = z.strictObject({ id: z.string().optional(), updated: z.string().optional(), name: z.string().trim().min(1).max(80), width_mm: dimension, height_mm: dimension, active: z.boolean() })
export const paperFormatSchema = z.object({ ...paperFormatInputSchema.shape, id: z.string(), updated: z.string() })
export type PaperFormat = z.infer<typeof paperFormatSchema>
export type PaperFormatInput = z.infer<typeof paperFormatInputSchema>
