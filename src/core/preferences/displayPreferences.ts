import { z } from 'zod'
export const displayPreferenceSchema = z.object({
  showCounters: z.boolean(), highlightNonZero: z.boolean(),
  theme: z.enum(['default', 'light', 'dark']).default('default'),
  searchWidth: z.number().int().min(400).max(1200).nullable().default(null),
  sidebarWidth: z.number().int().min(180).max(360).nullable().default(null),
  density: z.enum(['default', 'compact', 'comfortable']).default('default'),
}).strict()
export const displayPreferenceRecordSchema = z.object({ revision: z.number().int().nonnegative(), preference: displayPreferenceSchema }).strict()
export const defaultDisplayPreference = displayPreferenceSchema.parse({ showCounters: true, highlightNonZero: true })
export type DisplayPreference = z.infer<typeof displayPreferenceSchema>
export type DisplayPreferenceRecord = z.infer<typeof displayPreferenceRecordSchema>
export function highlightCounter(count: number | undefined, preference: DisplayPreference) { return preference.highlightNonZero && count !== undefined && Number.isFinite(count) && count !== 0 }
export function personalComfort(preference: DisplayPreference) {
  return {
    ...(preference.searchWidth === null ? {} : { search_width: preference.searchWidth }),
    ...(preference.sidebarWidth === null ? {} : { sidebar_width: preference.sidebarWidth }),
    ...(preference.density === 'default' ? {} : preference.density === 'compact' ? { row_height: 30, control_height: 30 } : { row_height: 38, control_height: 36 }),
  }
}
