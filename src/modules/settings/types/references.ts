import type { z } from 'zod'
import type { catalogNames, referenceSchema, referenceInputSchema } from '../schemas/references'
export type CatalogName = typeof catalogNames[number]
export type Reference = z.infer<typeof referenceSchema>
export type ReferenceInput = z.infer<typeof referenceInputSchema>
