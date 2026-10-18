import { mergePreviewSchema } from '../../../shared/merge/schema'
import { z } from 'zod'
import type { ContactKind } from '../types/contacts'
export const contactMergePreviewSchema = mergePreviewSchema.extend({ kind: z.enum(['companies', 'people']) })
export type ContactMergePreview = z.infer<typeof contactMergePreviewSchema>
export type ContactMergeSelection = { kind: ContactKind; source: string; target: string }
export type ContactMergeApplication = ContactMergeSelection & { fingerprint: string; choices: Record<string, 'source' | 'target'>; confirmed: true }
