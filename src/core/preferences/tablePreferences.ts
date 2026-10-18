import { z } from 'zod'
const id = z.string().min(1).max(160).refine((value) => Boolean(value.trim()) && [...value].every((character) => character.charCodeAt(0) >= 32 && character.charCodeAt(0) !== 127))
const ids = z.array(id).max(100)
export const tablePreferenceSchema = z.object({ order: ids, hidden: ids, widths: z.record(id, z.number().finite().min(36).max(10000)).refine((value) => Object.keys(value).length <= 100).optional() }).strict()
export const tablePreferenceRecordSchema = z.object({ revision: z.number().int().nonnegative(), preference: tablePreferenceSchema })
export type TablePreference = z.infer<typeof tablePreferenceSchema>
export type TablePreferenceRecord = z.infer<typeof tablePreferenceRecordSchema>
