import { z } from 'zod'
export const mergeKindSchema = z.enum(['companies', 'people', 'products'])
export type MergeKind = z.infer<typeof mergeKindSchema>
export const mergeIdentitySchema = z.object({ id: z.string(), collectionId: z.string(), label: z.string(), detail: z.string().optional() })
export type MergeIdentity = z.infer<typeof mergeIdentitySchema>
export const mergePreviewSchema = z.object({
  kind: mergeKindSchema, source: mergeIdentitySchema, target: mergeIdentitySchema,
  fields: z.array(z.object({ key: z.string(), source: z.string(), target: z.string(), source_label: z.string(), target_label: z.string(), readonly: z.boolean().optional() })),
  blockers: z.array(z.string()), fingerprint: z.string(), counts: z.record(z.string(), z.number()),
})
export type MergePreview = z.infer<typeof mergePreviewSchema>
export type MergeSelection = { kind: MergeKind; source: string; target: string }
export type MergeApplication = MergeSelection & { fingerprint: string; choices: Record<string, 'source' | 'target'>; confirmed: true }
export type MergeAdapter = {
  key: string
  title: string
  labels: Record<string, string>
  countLabels: Record<string, string>
  description: string
  search: (search: string) => Promise<MergeIdentity[]>
  preview: (selection: MergeSelection) => Promise<MergePreview>
  apply: (selection: MergeApplication) => Promise<{ id: string }>
}

export const mergeChoicesSchema = z.object({ items: z.array(z.object({ left: mergeIdentitySchema })) })
