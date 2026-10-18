import { z } from 'zod'
import { mergeIdentitySchema } from '../../../shared/merge/schema'
export const candidatesSchema = z.object({ items: z.array(z.object({ id: z.string(), left: mergeIdentitySchema, right: mergeIdentitySchema.nullable(), reasons: z.array(z.string()), members: z.number() })), totalItems: z.number(), totalPages: z.number(), page: z.number(), mode: z.enum(['manual', 'duplicates']) })
export type Candidate = z.infer<typeof candidatesSchema>['items'][number]
